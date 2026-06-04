import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_conversations')
@Index(['session_id'])
@Index(['conversation_type'])
export class AiConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  session_id: string;

  @Column({ type: 'varchar', length: 20 })
  role: string; // 'user' | 'assistant'

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model: string;

  @Column({ type: 'int', default: 0 })
  tokens_used: number;

  @Column({ type: 'varchar', length: 20, default: 'staff' })
  conversation_type: string; // 'staff' | 'customer'

  @CreateDateColumn()
  created_at: Date;
}
