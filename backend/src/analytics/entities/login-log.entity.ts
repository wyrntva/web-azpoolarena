import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('login_logs')
@Index(['user_id'])
@Index(['login_at'])
export class LoginLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @CreateDateColumn({ name: 'login_at', type: 'timestamptz' })
  login_at: Date;

  @Column({ name: 'ip_address', nullable: true, type: 'varchar', length: 45 })
  ip_address: string | null;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  user_agent: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
