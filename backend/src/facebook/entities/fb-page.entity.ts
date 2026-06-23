import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fb_pages')
export class FbPageEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string; // Facebook Page ID

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  access_token: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
