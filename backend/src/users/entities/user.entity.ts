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
import { RoleEntity } from '../../roles/entities/role.entity';
import { SalaryType } from '../../common/enums';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', length: 255 })
  hashed_password: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  pin: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column()
  role_id: number;

  @Column({ type: 'enum', enum: SalaryType, default: SalaryType.HOURLY })
  salary_type: SalaryType;

  @Column({ type: 'float', nullable: true })
  hourly_rate: number;

  @Column({ type: 'float', nullable: true })
  fixed_salary: number;

  @Column({ type: 'int', nullable: true })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => RoleEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  /** Computed: check if user is admin */
  get is_admin(): boolean {
    return (
      this.role_id === 4 ||
      (this.role && ['admin', 'Quản lý'].includes(this.role.name))
    );
  }
}
