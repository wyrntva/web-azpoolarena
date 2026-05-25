import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// ==================== Area ====================
@Entity('areas')
export class AreaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  table_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TableEntity, (t) => t.area, { cascade: true })
  tables: TableEntity[];
}

// ==================== Table ====================
@Entity('tables')
export class TableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column()
  area_id: number;

  @Column({ type: 'int', default: 0 })
  x: number;

  @Column({ type: 'int', default: 0 })
  y: number;

  @Column({ type: 'int', default: 100 })
  width: number;

  @Column({ type: 'int', default: 60 })
  height: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  device_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_os: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  device_app_version: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_ip: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_mac: string;

  @Column({ type: 'timestamp', nullable: true })
  device_activated_at: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  camera_main_stream: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  camera_sub_stream: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => AreaEntity, (a) => a.tables)
  @JoinColumn({ name: 'area_id' })
  area: AreaEntity;
}
