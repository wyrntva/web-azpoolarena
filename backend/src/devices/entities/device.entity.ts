import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 6, unique: true })
  device_code: string;

  @Column({ type: 'varchar', length: 255 })
  device_name: string;

  @Column({ type: 'varchar', length: 100, default: 'POS' })
  device_type: string;

  @Column({ type: 'boolean', default: false })
  is_activated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  activated_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_os: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_app_version: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
