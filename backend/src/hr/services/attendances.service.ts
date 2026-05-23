import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AttendanceEntity,
  WorkScheduleEntity,
  QRSessionEntity,
  QRAccessTokenEntity,
  WiFiConfigEntity,
} from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import {
  PublicAttendanceCheckRequestDto,
  AttendanceCheckRequestDto,
  UpdateAttendanceDto,
  CreateManualAttendanceDto,
  CreateQRTokenDto,
} from '../dto/hr.dto';
import { QRTokenType, AttendanceStatus } from '../../common/enums';
import {
  findAttendanceAndWorkdate,
  computeShiftWindows,
  normalizeManualCheckTimes,
  recalculateStatus,
} from '../helpers/attendance.helpers';
import { PayrollService } from './payroll.service';
import moment from 'moment';
import * as crypto from 'crypto';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(WorkScheduleEntity)
    private readonly scheduleRepo: Repository<WorkScheduleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(QRSessionEntity)
    private readonly qrSessionRepo: Repository<QRSessionEntity>,
    @InjectRepository(QRAccessTokenEntity)
    private readonly qrAccessTokenRepo: Repository<QRAccessTokenEntity>,
    @InjectRepository(WiFiConfigEntity)
    private readonly wifiConfigRepo: Repository<WiFiConfigEntity>,
    private readonly payrollService: PayrollService,
  ) {}

  // ==================== Validation Logic ====================
  private async validateWifiConnection(
    ssid?: string,
    bssid?: string,
    ipAddress?: string,
  ): Promise<{ isValid: boolean; message: string }> {
    const wifiConfigs = await this.wifiConfigRepo.find({
      where: { is_active: true },
    });
    if (wifiConfigs.length === 0)
      return {
        isValid: true,
        message: 'Wifi validation skipped (no active configs)',
      };

    if (!ssid)
      return {
        isValid: false,
        message: 'Bạn phải kết nối WiFi của cửa hàng để chấm công',
      };

    for (const config of wifiConfigs) {
      if (config.ssid === ssid) {
        if (
          !config.bssid ||
          !bssid ||
          config.bssid.toLowerCase() === bssid.toLowerCase()
        ) {
          return { isValid: true, message: 'Valid' };
        }
      }
    }
    return {
      isValid: false,
      message: `WiFi ${ssid} không hợp lệ hoặc sai địa chỉ BSSID`,
    };
  }

  private async validateQrAccessToken(token: string): Promise<{
    isValid: boolean;
    tokenType: QRTokenType;
    session?: QRSessionEntity | null;
  }> {
    // 1. Check permanent QR Sessions
    const qrSession = await this.qrSessionRepo.findOne({
      where: { qr_token: token },
    });
    if (qrSession) {
      if (qrSession.expires_at < new Date())
        return {
          isValid: false,
          tokenType: qrSession.token_type,
          session: qrSession,
        };
      return {
        isValid: true,
        tokenType: qrSession.token_type,
        session: qrSession,
      };
    }

    // 2. Check QR Access Tokens (one-time)
    const qrAccess = await this.qrAccessTokenRepo.findOne({
      where: { access_token: token },
    });
    if (qrAccess) {
      const gracePeriod = moment(qrAccess.used_at).add(60, 'seconds').toDate();
      if (qrAccess.is_used && new Date() > gracePeriod) {
        return { isValid: false, tokenType: QRTokenType.ATTENDANCE };
      }
      if (!qrAccess.is_used && qrAccess.expires_at < new Date()) {
        return { isValid: false, tokenType: QRTokenType.ATTENDANCE };
      }
      return { isValid: true, tokenType: QRTokenType.ATTENDANCE }; // Defaults to auto-detect attendance
    }

    return { isValid: false, tokenType: QRTokenType.ATTENDANCE };
  }

  // Consume a one-time QR access token. Returns true if attendance should proceed.
  // Handles the case where QRAccess page already pre-consumed the token (is_used=true)
  // before the user entered their PIN — still valid within the 60s grace period.
  private async consumeQrAccessToken(token: string, userPin: string): Promise<boolean> {
    const existing = await this.qrAccessTokenRepo.findOne({
      where: { access_token: token },
    });

    // Not a one-time access token (permanent session token) — no consume needed
    if (!existing) return true;

    // Already consumed within grace period (QRAccess page pre-consumed it before PIN entry)
    if (existing.is_used && existing.used_at) {
      const gracePeriod = moment(existing.used_at).add(60, 'seconds').toDate();
      if (new Date() <= gracePeriod) {
        // Record the PIN now that we know who used it
        if (!existing.used_by_pin) {
          await this.qrAccessTokenRepo.update(
            { access_token: token },
            { used_by_pin: userPin },
          );
        }
        return true;
      }
      return false; // Grace period expired after pre-consume
    }

    // Token not yet consumed — atomic consume to prevent race conditions
    const result = await this.qrAccessTokenRepo
      .createQueryBuilder()
      .update()
      .set({ is_used: true, used_at: new Date(), used_by_pin: userPin })
      .where('access_token = :token', { token })
      .andWhere('is_used = false')
      .andWhere('expires_at > :now', { now: new Date() })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  // ==================== Actions ====================

  async generateQrCode(dto: CreateQRTokenDto, currentUserId: number) {
    const tokenType = dto.token_type as QRTokenType;
    if (!Object.values(QRTokenType).includes(tokenType)) {
      throw new BadRequestException(
        "Invalid token type. Must be 'check_in', 'check_out', or 'attendance'",
      );
    }

    const qrToken = crypto.randomUUID();
    const expiresAt = moment().add(24, 'hours').toDate(); // Or based on settings

    const qrSession = this.qrSessionRepo.create({
      qr_token: qrToken,
      token_type: tokenType,
      expires_at: expiresAt,
      is_used: false,
    });

    await this.qrSessionRepo.save(qrSession);
    return qrSession;
  }

  async publicCheckAttendance(
    dto: PublicAttendanceCheckRequestDto,
    ipAddress: string,
  ) {
    const user = await this.userRepo.findOne({ where: { pin: dto.pin } });
    if (!user)
      throw new NotFoundException('Mã PIN không đúng hoặc không tồn tại');

    const qrStatus = await this.validateQrAccessToken(dto.qr_token);
    if (!qrStatus.isValid)
      throw new BadRequestException('Mã QR không hợp lệ hoặc đã hết hạn');

    const { attendance: currentAtt, workDate } =
      await findAttendanceAndWorkdate(this.attendanceRepo, user.id);

    const workSchedule = await this.scheduleRepo.findOne({
      where: { user_id: user.id, work_date: workDate, is_active: true },
    });

    if (!workSchedule) {
      throw new ForbiddenException(
        `Bạn không có lịch làm việc hôm nay (${workDate})`,
      );
    }

    const now = new Date();
    const windows = computeShiftWindows(workSchedule);

    let actionType = qrStatus.tokenType;
    let attendance = currentAtt;

    if (actionType === QRTokenType.ATTENDANCE) {
      if (!attendance || !attendance.check_in_time) {
        actionType = QRTokenType.CHECK_IN;
      } else {
        if (now > windows.latestAllowedCheckoutDt) {
          const today = moment().format('YYYY-MM-DD');
          if (workDate !== today) {
            const todaySchedule = await this.scheduleRepo.findOne({
              where: { user_id: user.id, work_date: today, is_active: true },
            });
            if (todaySchedule) {
              attendance = null;
              Object.assign(workSchedule, todaySchedule);
              Object.assign(windows, computeShiftWindows(workSchedule));
              actionType = QRTokenType.CHECK_IN;
            } else {
              actionType = QRTokenType.CHECK_OUT;
            }
          } else {
            actionType = QRTokenType.CHECK_OUT;
          }
        } else {
          actionType = QRTokenType.CHECK_OUT;
        }
      }
    }

    if (actionType === QRTokenType.CHECK_IN) {
      if (attendance && attendance.check_in_time) {
        throw new BadRequestException('Bạn đã vào ca rồi hôm nay');
      }

      if (now < windows.earliestCheckInDt) {
        throw new BadRequestException(
          `Quá sớm để vào ca. Ca làm bắt đầu lúc ${workSchedule.start_time}, cho phép check-in từ ${moment(windows.earliestCheckInDt).format('HH:mm')}`,
        );
      }

      if (now > windows.endDt) {
        throw new BadRequestException(
          `Đã quá giờ kết thúc ca (${workSchedule.end_time}), không thể vào ca`,
        );
      }

      const status =
        now <= windows.latestCheckInDt
          ? AttendanceStatus.PRESENT
          : AttendanceStatus.LATE;

      const newAttendance = this.attendanceRepo.create({
        user_id: user.id,
        work_schedule_id: workSchedule.id,
        date: workSchedule.work_date,
        check_in_time: now,
        check_in_qr_token: dto.qr_token,
        ip_address: ipAddress,
        status: status,
      });

      await this.attendanceRepo.save(newAttendance);

      const consumed = await this.consumeQrAccessToken(dto.qr_token, user.pin);
      if (!consumed) {
        // One-time token was claimed by another concurrent request — roll back
        await this.attendanceRepo.remove(newAttendance);
        throw new BadRequestException('Mã QR đã được sử dụng bởi người khác, vui lòng thử lại');
      }

      const dateStr = typeof newAttendance.date === 'string'
        ? newAttendance.date
        : moment(newAttendance.date).format('YYYY-MM-DD');
      await this.payrollService.autoGeneratePenaltyForAttendance(user.id, dateStr);

      return {
        success: true,
        action: 'check_in',
        message: `Vào ca thành công lúc ${moment(now).format('HH:mm:ss')}`,
        attendance_id: newAttendance.id,
        check_in_time: newAttendance.check_in_time,
        status: newAttendance.status,
      };
    } else if (actionType === QRTokenType.CHECK_OUT) {
      if (!attendance || !attendance.check_in_time) {
        throw new BadRequestException('Bạn phải vào ca trước khi tan ca');
      }

      if (attendance.check_out_time) {
        throw new BadRequestException('Bạn đã tan ca rồi hôm nay');
      }

      if (now < attendance.check_in_time) {
        throw new BadRequestException(
          'Thời gian tan ca không được trước thời gian vào ca',
        );
      }

      if (now > windows.latestAllowedCheckoutDt) {
        throw new BadRequestException(
          'Đã quá thời gian cho phép tan ca (hoặc bạn quên tan ca hôm trước)',
        );
      }

      attendance.check_out_time = now;
      attendance.check_out_qr_token = dto.qr_token;
      recalculateStatus(attendance, workSchedule);

      await this.attendanceRepo.save(attendance);

      const consumed = await this.consumeQrAccessToken(dto.qr_token, user.pin);
      if (!consumed) {
        // Roll back check_out
        attendance.check_out_time = null;
        attendance.check_out_qr_token = null;
        recalculateStatus(attendance, workSchedule);
        await this.attendanceRepo.save(attendance);
        throw new BadRequestException('Mã QR đã được sử dụng bởi người khác, vui lòng thử lại');
      }

      const dateStr = typeof attendance.date === 'string'
        ? attendance.date
        : moment(attendance.date).format('YYYY-MM-DD');
      await this.payrollService.autoGeneratePenaltyForAttendance(user.id, dateStr);

      return {
        success: true,
        action: 'check_out',
        message: `Tan ca thành công lúc ${moment(now).format('HH:mm:ss')}`,
        attendance_id: attendance.id,
        check_in_time: attendance.check_in_time,
        check_out_time: attendance.check_out_time,
        status: attendance.status,
      };
    }
  }

  async checkAttendance(
    dto: AttendanceCheckRequestDto,
    user: any,
    ipAddress: string,
  ) {
    // Authenticated check (essentially the same logic, but with Wifi validation added)
    if (user.is_admin) {
      throw new ForbiddenException('Quản trị viên không chấm công qua endpoint này');
    }

    if (!user.pin) {
      throw new BadRequestException(
        'Bạn chưa có mã PIN. Vui lòng liên hệ quản trị viên',
      );
    }

    if (user.pin !== dto.pin) {
      throw new UnauthorizedException('Mã PIN không đúng');
    }

    const wifiStatus = await this.validateWifiConnection(
      dto.wifi_ssid,
      dto.wifi_bssid,
      ipAddress,
    );
    if (!wifiStatus.isValid) {
      throw new ForbiddenException(wifiStatus.message);
    }

    // Call shared logic
    return this.publicCheckAttendance(
      { pin: dto.pin, qr_token: dto.qr_token },
      ipAddress,
    );
  }

  async getTimesheet(
    userId: number | null,
    startDate?: string,
    endDate?: string,
    statusFilter?: string,
    page: number = 1,
    pageSize: number = 20,
    currentUser: any = null,
  ) {
    // Non-admins can only view their own records
    const isAdmin = currentUser?.is_admin || currentUser?.role?.name === 'Trưởng ca';
    let targetUserId = userId;
    if (!isAdmin) {
      targetUserId = currentUser?.id ?? null;
    }

    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.user', 'user')
      .leftJoinAndSelect('att.work_schedule', 'work_schedule')
      .orderBy('att.date', 'DESC')
      .addOrderBy('att.check_in_time', 'DESC');

    if (targetUserId) {
      qb.andWhere('att.user_id = :userId', { userId: targetUserId });
    }
    if (startDate) {
      qb.andWhere('att.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('att.date <= :endDate', { endDate });
    }
    if (statusFilter) {
      qb.andWhere('att.status = :status', { status: statusFilter });
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map((att) => ({
        id: att.id,
        user_id: att.user_id,
        work_schedule_id: att.work_schedule_id,
        date: att.date,
        check_in_time: att.check_in_time,
        check_out_time: att.check_out_time,
        wifi_ssid: att.wifi_ssid,
        wifi_bssid: att.wifi_bssid,
        ip_address: att.ip_address,
        status: att.status,
        notes: att.notes,
        created_at: att.created_at,
        updated_at: att.updated_at,
        user: {
          id: att.user?.id,
          full_name: att.user?.full_name,
          username: att.user?.username,
          email: att.user?.email,
        },
        work_schedule: att.work_schedule
          ? {
              id: att.work_schedule.id,
              work_date: att.work_schedule.work_date,
              start_time: att.work_schedule.start_time,
              end_time: att.work_schedule.end_time,
              allowed_late_minutes: att.work_schedule.allowed_late_minutes,
            }
          : null,
      })),
    };
  }

  async updateAttendance(id: number, dto: UpdateAttendanceDto) {
    const attendance = await this.attendanceRepo.findOne({
      where: { id },
      relations: ['work_schedule'],
    });

    if (!attendance)
      throw new NotFoundException('Không tìm thấy bản ghi chấm công');

    if (attendance.work_schedule) {
      const { checkInDt, checkOutDt } = normalizeManualCheckTimes(
        attendance.work_schedule.work_date.toString(),
        attendance.work_schedule.start_time,
        attendance.work_schedule.end_time,
        dto.check_in_time !== undefined ? dto.check_in_time : attendance.check_in_time,
        dto.check_out_time !== undefined ? dto.check_out_time : attendance.check_out_time,
      );
      if (dto.check_in_time !== undefined) attendance.check_in_time = checkInDt as Date | null;
      if (dto.check_out_time !== undefined) attendance.check_out_time = checkOutDt as Date | null;
    } else {
      if (dto.check_in_time !== undefined) attendance.check_in_time = dto.check_in_time as Date | null;
      if (dto.check_out_time !== undefined) attendance.check_out_time = dto.check_out_time as Date | null;
    }

    if (dto.notes !== undefined) attendance.notes = dto.notes;

    if (!attendance.check_in_time && attendance.check_out_time) {
      throw new BadRequestException('Không thể có giờ tan ca mà không có giờ vào ca');
    }

    if (attendance.work_schedule) {
      recalculateStatus(attendance, attendance.work_schedule);
    }

    await this.attendanceRepo.save(attendance);

    const dateStr = typeof attendance.date === 'string'
      ? attendance.date
      : moment(attendance.date).format('YYYY-MM-DD');
    await this.payrollService.autoGeneratePenaltyForAttendance(attendance.user_id, dateStr);

    return attendance;
  }

  async createManualAttendance(dto: CreateManualAttendanceDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');

    const existing = await this.attendanceRepo.findOne({
      where: { user_id: dto.user_id, date: dto.date },
    });
    if (existing)
      throw new BadRequestException(
        'Đã có bản ghi chấm công cho nhân viên này vào ngày này',
      );

    const checkSchedule = await this.scheduleRepo.findOne({
      where: { user_id: dto.user_id, work_date: dto.date, is_active: true },
    });

    if (!checkSchedule) {
      throw new BadRequestException(
        'Không có lịch làm việc cho nhân viên này vào ngày này',
      );
    }

    const { checkInDt, checkOutDt } = normalizeManualCheckTimes(
      dto.date,
      checkSchedule.start_time,
      checkSchedule.end_time,
      dto.check_in_time,
      dto.check_out_time,
    );

    const attendance = this.attendanceRepo.create({
      user_id: dto.user_id,
      work_schedule_id: checkSchedule.id,
      date: dto.date,
      check_in_time: checkInDt,
      check_out_time: checkOutDt,
      notes: dto.notes,
    });

    recalculateStatus(attendance, checkSchedule);

    await this.attendanceRepo.save(attendance);

    const dateStr = typeof attendance.date === 'string'
      ? attendance.date
      : moment(attendance.date).format('YYYY-MM-DD');
    await this.payrollService.autoGeneratePenaltyForAttendance(attendance.user_id, dateStr);

    return attendance;
  }
}
