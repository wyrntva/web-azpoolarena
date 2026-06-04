import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { FbMessageEntity } from './fb-message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',            // AI đang trả lời
  HUMAN_SUPPORT = 'human_support', // Chuyển nhân viên
  RESOLVED = 'resolved',        // Đã giải quyết xong
}

@Entity('fb_customers')
@Index(['psid'], { unique: true })
export class FbCustomerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Page-Scoped ID — định danh duy nhất Facebook gán cho mỗi user
  @Column({ type: 'varchar', length: 100, unique: true })
  psid: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_pic: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  conversation_status: ConversationStatus;

  // Tên nhân viên đang hỗ trợ (khi chuyển sang HUMAN_SUPPORT)
  @Column({ type: 'varchar', length: 100, nullable: true })
  assigned_staff: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => FbMessageEntity, (m) => m.customer, { cascade: true })
  messages: FbMessageEntity[];
}
