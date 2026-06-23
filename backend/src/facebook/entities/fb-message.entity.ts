import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FbCustomerEntity } from './fb-customer.entity';

export enum MessageRole {
  USER = 'user', // Khách hàng gửi
  ASSISTANT = 'assistant', // AI/nhân viên trả lời
}

export enum MessageSource {
  AI = 'ai',
  HUMAN = 'human',
}

@Entity('fb_messages')
@Index(['customer_id'])
@Index(['created_at'])
export class FbMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customer_id: number;

  @ManyToOne(() => FbCustomerEntity, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: FbCustomerEntity;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageSource,
    default: MessageSource.AI,
    nullable: true,
  })
  source: MessageSource;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model: string;

  @Column({ type: 'int', default: 0 })
  tokens_used: number;

  // Chi phí ước tính (USD)
  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0 })
  estimated_cost: number;

  // Thời gian xử lý (ms)
  @Column({ type: 'int', default: 0 })
  response_time_ms: number;

  @CreateDateColumn()
  created_at: Date;
}
