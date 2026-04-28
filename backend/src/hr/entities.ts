import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AttendanceStatus, QRTokenType } from '../common/enums';

// ==================== WiFiConfig ====================
@Entity('wifi_configs')
export class WiFiConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  ssid: string;

  @Column({ type: 'varchar', length: 17, nullable: true })
  bssid: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_range: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ip_subnet: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== QRSession ====================
@Entity('qr_sessions')
export class QRSessionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  qr_token: string;

  @Column({ type: 'enum', enum: QRTokenType })
  token_type: QRTokenType;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ nullable: true })
  used_by: number;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  @CreateDateColumn()
  created_at: Date;
}

// ==================== WorkSchedule ====================
@Entity('work_schedules')
export class WorkScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  work_date: string;

  @Column({ type: 'varchar', length: 5 })
  start_time: string;

  @Column({ type: 'varchar', length: 5 })
  end_time: string;

  @Column({ type: 'int', default: 0 })
  allowed_late_minutes: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => AttendanceEntity, (a) => a.work_schedule)
  attendances: AttendanceEntity[];

  @ManyToOne('UserEntity')
  @JoinColumn({ name: 'user_id' })
  user: any;
}

// ==================== Attendance ====================
@Entity('attendances')
export class AttendanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  work_schedule_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  check_in_qr_token: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  check_out_qr_token: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  wifi_ssid: string;

  @Column({ type: 'varchar', length: 17, nullable: true })
  wifi_bssid: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => WorkScheduleEntity, (ws) => ws.attendances)
  @JoinColumn({ name: 'work_schedule_id' })
  work_schedule: WorkScheduleEntity;

  @ManyToOne('UserEntity')
  @JoinColumn({ name: 'user_id' })
  user: any;
}

// ==================== AttendanceSettings ====================
@Entity('attendance_settings')
export class AttendanceSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 15 })
  allowed_late_minutes: number;

  @Column({ type: 'text' })
  penalty_tiers: string; // JSON

  @Column({ type: 'int', default: 10 })
  early_checkout_grace_minutes: number;

  @Column({ type: 'float', default: 50000 })
  early_checkout_penalty: number;

  @Column({ type: 'float', default: 100000 })
  absent_penalty: number;

  @Column({ type: 'boolean', default: true })
  auto_absent_enabled: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== AdvancePayment ====================
@Entity('advance_payments')
export class AdvancePaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== Bonus ====================
@Entity('bonuses')
export class BonusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== Penalty ====================
@Entity('penalties')
export class PenaltyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== QRAccessDevice ====================
@Entity('qr_access_devices')
export class QRAccessDeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  device_id: string;

  @Column({ type: 'varchar', length: 200 })
  device_name: string;

  @Column({ type: 'varchar', length: 255 })
  api_key_hash: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date;

  @CreateDateColumn()
  created_at: Date;
}

// ==================== QRAccessToken ====================
@Entity('qr_access_tokens')
export class QRAccessTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  access_token: string;

  @Column({ type: 'varchar', length: 100 })
  device_id: string;

  @Column({ type: 'varchar', length: 50 })
  purpose: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  @Column({ type: 'varchar', length: 4, nullable: true })
  used_by_pin: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => QRAccessDeviceEntity)
  @JoinColumn({ name: 'device_id', referencedColumnName: 'device_id' })
  device: QRAccessDeviceEntity;
}
