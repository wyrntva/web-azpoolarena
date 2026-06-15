import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';

// ================ TOURNAMENT SETTINGS MODELS ================

@Entity('tournament_ranks')
export class TournamentRankEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  order: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  min_score: number;

  @Column({ type: 'int', default: 0 })
  max_score: number;

  @Column({ type: 'int', default: 0 })
  default_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('tournament_rounds')
export class TournamentRoundEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', unique: true })
  order: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tournament_type: string;

  @Column({ type: 'int', nullable: true })
  number_of_players: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  multiplier: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export enum ScoringRuleType {
  WIN = 'win',
  LOSE = 'lose',
  DRAW = 'draw',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

@Entity('scoring_rules')
export class ScoringRuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', unique: true })
  position: number;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'enum', enum: ScoringRuleType })
  rule_type: ScoringRuleType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('tournament_coefficients')
export class CoefficientEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'float', default: 1.0 })
  value: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ================ TOURNAMENTS ================

@Entity('tournaments')
export class TournamentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  banner: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  organizer_logo: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  detail_logo: string;

  @Column({ type: 'text', nullable: true })
  sponsor_logos: string;

  @Column({ type: 'text', nullable: true })
  ranks: string;

  @Column({ type: 'varchar', length: 50, default: 'public' })
  display: string;

  @Column({ type: 'timestamp', nullable: true })
  public_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'upcoming' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'knockout' })
  tournament_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  knockout_from_round: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  competition_format: string;

  @Column({ type: 'int', default: 32 })
  number_of_players: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  registration_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  registration_end_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organizer: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  support_phone: string;

  @Column({ type: 'boolean', default: true })
  can_register: boolean;

  @Column({ type: 'boolean', default: false })
  free_registration_fee: boolean;

  @Column({ type: 'boolean', default: false })
  free_table_fee: boolean;

  @Column({ type: 'boolean', default: false })
  pre_payment: boolean;

  @Column({ type: 'float', nullable: true })
  registration_fee: number;

  @Column({ type: 'float', nullable: true })
  total_prize: number;

  @Column({ type: 'float', nullable: true })
  first_prize: number;

  @Column({ type: 'float', nullable: true })
  second_prize: number;

  @Column({ type: 'float', nullable: true })
  third_prize: number;

  @Column({ type: 'float', nullable: true })
  top_5_8_prize: number;

  @Column({ type: 'float', nullable: true })
  top_9_16_prize: number;

  @Column({ type: 'float', nullable: true })
  top_17_32_prize: number;

  @Column({ type: 'float', nullable: true })
  top_33_64_prize: number;

  @Column({ type: 'float', nullable: true })
  top_65_128_prize: number;

  @Column({ type: 'float', nullable: true })
  top_129_256_prize: number;

  @Column({ type: 'boolean', default: false })
  has_draw: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  draw_touch: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  handicap_1_touch: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  handicap_2_touch: string;

  @Column({ type: 'boolean', default: false })
  round_1_64: boolean;

  @Column({ type: 'boolean', default: false })
  round_1_16: boolean;

  @Column({ type: 'boolean', default: false })
  round_1_32: boolean;

  @Column({ type: 'boolean', default: false })
  round_1_8: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quarter_final: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  draw_from_round: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  semi_final: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  final: string;

  @Column({ type: 'text', nullable: true })
  enabled_tables: string | null;

  @Column({ type: 'text', nullable: true })
  priority_tables: string | null;

  @Column({ type: 'boolean', default: false })
  is_pinned: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('tournament_registrations')
export class TournamentRegistrationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tournament_id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rank: string;

  @CreateDateColumn()
  registered_at: Date;

  @ManyToOne(() => TournamentEntity)
  @JoinColumn({ name: 'tournament_id' })
  tournament: TournamentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}

export enum TournamentMatchStatus {
  PENDING = 'pending',
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export enum TournamentMatchBracket {
  WINNERS = 'winners',
  LOSERS = 'losers',
  KNOCKOUT = 'knockout',
}

@Entity('tournament_matches')
@Index(['tournament_id', 'match_no'], { unique: true })
export class TournamentMatchEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tournament_id: number;

  @Column({ type: 'int' })
  match_no: number;

  @Column({ type: 'varchar', length: 20 })
  bracket: string;

  @Column({ type: 'int', default: 1 })
  round: number;

  @Column({ type: 'int', nullable: true })
  player1_id: number | null;

  @Column({ type: 'int', nullable: true })
  player2_id: number | null;

  @Column({ type: 'int', default: 0 })
  player1_score: number;

  @Column({ type: 'int', default: 0 })
  player2_score: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  table_no: string;

  @Column({ type: 'timestamp', nullable: true })
  match_time: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: TournamentMatchStatus.PENDING,
  })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'unconfirmed' })
  player1_check_in: string;

  @Column({ type: 'varchar', length: 20, default: 'unconfirmed' })
  player2_check_in: string;

  @Column({ type: 'int', nullable: true })
  winner_id: number | null;

  @Column({ type: 'int', nullable: true })
  player1_points: number | null;

  @Column({ type: 'int', nullable: true })
  player2_points: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  player1_rank: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  player2_rank: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TournamentEntity)
  @JoinColumn({ name: 'tournament_id' })
  tournament: TournamentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'player1_id' })
  player1: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'player2_id' })
  player2: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'winner_id' })
  winner: UserEntity;
}

@Entity('tournament_payment_codes')
export class PaymentCodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 19, unique: true })
  code: string;

  @Column({ type: 'int' })
  tournament_id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}

export enum TableFeePaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('tournament_table_fee_payments')
export class TableFeePaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string; // Format: "TFEE" + 8 random alphanum

  @Column({ type: 'int' })
  match_id: number;

  @Column({ type: 'int' })
  amount: number; // Total amount in VND

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: TableFeePaymentStatus.PENDING,
  })
  status: TableFeePaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date | null;

  @Column({ type: 'int', nullable: true })
  duration_sec: number | null;

  @Column({ type: 'int', default: 0 })
  surcharge: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payment_method: string | null; // 'cash' | 'bank_transfer'

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;
}
