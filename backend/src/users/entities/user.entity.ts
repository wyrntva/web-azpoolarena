import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from '../../roles/entities/role.entity';
import { SalaryType } from '../../common/enums';

export type UserType = 'staff' | 'player' | 'both';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, default: 'staff' })
  user_type: UserType;

  // ── Staff fields ──────────────────────────────────────────
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  hashed_password: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  pin: string;

  @Column({ nullable: true })
  role_id: number;

  @Column({ type: 'enum', enum: SalaryType, default: SalaryType.HOURLY })
  salary_type: SalaryType;

  @Column({ type: 'float', nullable: true })
  hourly_rate: number;

  @Column({ type: 'float', nullable: true })
  fixed_salary: number;

  @Column({ type: 'int', nullable: true })
  display_order: number;

  // ── Common fields ─────────────────────────────────────────
  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // ── Player fields (nullable for staff) ────────────────────
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rank: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tiktok_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facebook_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagram_url: string;

  @Column({ type: 'int', default: 0 })
  total_games: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => RoleEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  get is_admin(): boolean {
    return (
      this.role_id === 1 ||
      (this.role && ['admin', 'Quản trị'].includes(this.role.name))
    );
  }
}
