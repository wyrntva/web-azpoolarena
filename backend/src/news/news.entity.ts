import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('news_articles')
export class NewsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 100, default: 'Tin tức' })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  date: string;

  @Column({ type: 'varchar', length: 255 })
  author: string;

  @Column({ type: 'varchar', length: 1000, default: '' })
  image: string;

  @Column({ type: 'text' })
  excerpt: string;

  @Column({ type: 'jsonb', default: [] })
  content: string[];

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @Column({ type: 'varchar', length: 1000, default: '' })
  fanpage_image: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  fb_post_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
