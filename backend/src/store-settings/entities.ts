import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('store_settings')
export class StoreSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  business_type: string;

  // Social media
  @Column({ type: 'varchar', length: 500, nullable: true })
  tiktok_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facebook_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  youtube_url: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  social_address: string;

  // Banners - Using 'text' instead of 'json' to match SQLAlchemy default OR we JSON.parse manually
  @Column({ type: 'text', nullable: true })
  banner_scoreboard: string; // Actually stores JSON string array

  @Column({ type: 'text', nullable: true })
  banner_tournament: string; // Actually stores JSON string array

  @Column({ type: 'varchar', length: 500, nullable: true })
  banner_ranking: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  banner_member: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
