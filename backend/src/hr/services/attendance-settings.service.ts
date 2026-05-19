import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceSettingsEntity } from '../entities';
import {
  CreateAttendanceSettingsDto,
  UpdateAttendanceSettingsDto,
} from '../dto/hr.dto';

@Injectable()
export class AttendanceSettingsService {
  constructor(
    @InjectRepository(AttendanceSettingsEntity)
    private readonly settingsRepo: Repository<AttendanceSettingsEntity>,
  ) {}

  private getDefaultPenaltyTiers() {
    return JSON.stringify([
      { max_minutes: 15, penalty_amount: 0 },
      { max_minutes: 30, penalty_amount: 50000 },
      { max_minutes: 60, penalty_amount: 100000 },
      { max_minutes: null, penalty_amount: 200000 },
    ]);
  }

  private mapResponse(settings: AttendanceSettingsEntity) {
    return {
      id: settings.id,
      allowed_late_minutes: settings.allowed_late_minutes,
      penalty_tiers: JSON.parse(settings.penalty_tiers || '[]'),
      early_checkout_grace_minutes: settings.early_checkout_grace_minutes,
      early_checkout_penalty: settings.early_checkout_penalty,
      missing_checkout_penalty: settings.missing_checkout_penalty,
      absent_penalty: settings.absent_penalty,
      auto_absent_enabled: settings.auto_absent_enabled,
      notes: settings.notes,
      is_active: settings.is_active,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };
  }

  async getSettings() {
    let settings = await this.settingsRepo.findOne({
      where: { is_active: true },
    });

    if (!settings) {
      settings = this.settingsRepo.create({
        allowed_late_minutes: 15,
        penalty_tiers: this.getDefaultPenaltyTiers(),
        early_checkout_grace_minutes: 10,
        early_checkout_penalty: 50000,
        missing_checkout_penalty: 30000,
        absent_penalty: 100000,
        auto_absent_enabled: true,
        is_active: true,
      });
      await this.settingsRepo.save(settings);
    }

    return this.mapResponse(settings);
  }

  async updateSettings(dto: UpdateAttendanceSettingsDto) {
    let settings = await this.settingsRepo.findOne({
      where: { is_active: true },
    });

    if (!settings) {
      settings = this.settingsRepo.create({
        allowed_late_minutes: 15,
        penalty_tiers: this.getDefaultPenaltyTiers(),
        early_checkout_grace_minutes: 10,
        early_checkout_penalty: 50000,
        missing_checkout_penalty: 30000,
        absent_penalty: 100000,
        auto_absent_enabled: true,
        is_active: true,
      });
    }

    if (dto.allowed_late_minutes !== undefined)
      settings.allowed_late_minutes = dto.allowed_late_minutes;
    if (dto.penalty_tiers !== undefined)
      settings.penalty_tiers = JSON.stringify(dto.penalty_tiers);
    if (dto.early_checkout_grace_minutes !== undefined)
      settings.early_checkout_grace_minutes = dto.early_checkout_grace_minutes;
    if (dto.early_checkout_penalty !== undefined)
      settings.early_checkout_penalty = dto.early_checkout_penalty;
    if (dto.missing_checkout_penalty !== undefined)
      settings.missing_checkout_penalty = dto.missing_checkout_penalty;
    if (dto.absent_penalty !== undefined)
      settings.absent_penalty = dto.absent_penalty;
    if (dto.auto_absent_enabled !== undefined)
      settings.auto_absent_enabled = dto.auto_absent_enabled;
    if (dto.notes !== undefined) settings.notes = dto.notes;

    await this.settingsRepo.save(settings);
    return this.mapResponse(settings);
  }

  async createSettings(dto: CreateAttendanceSettingsDto) {
    await this.settingsRepo.update({ is_active: true }, { is_active: false });

    const newSettings = this.settingsRepo.create({
      allowed_late_minutes: dto.allowed_late_minutes ?? 15,
      penalty_tiers: JSON.stringify(dto.penalty_tiers),
      early_checkout_grace_minutes: dto.early_checkout_grace_minutes ?? 10,
      early_checkout_penalty: dto.early_checkout_penalty ?? 50000,
      missing_checkout_penalty: dto.missing_checkout_penalty ?? 30000,
      absent_penalty: dto.absent_penalty ?? 100000,
      auto_absent_enabled: dto.auto_absent_enabled ?? true,
      notes: dto.notes,
      is_active: true,
    });

    await this.settingsRepo.save(newSettings);
    return this.mapResponse(newSettings);
  }
}
