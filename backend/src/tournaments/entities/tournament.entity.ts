import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PoolArenaUserGender, ScoringRuleType } from '../../common/enums';

// ==================== PoolArenaUser ====================
@Entity('pool_arena_users')
export class PoolArenaUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'enum', enum: PoolArenaUserGender, nullable: true })
  gender: PoolArenaUserGender;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rank: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', length: 255 })
  hashed_password: string;

  @Column({ type: 'varchar', length: 50, default: 'player' })
  role: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tiktok_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facebook_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagram_url: string;

  @Column({ type: 'int', default: 0 })
  total_games: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  get win_rate(): number {
    if (this.total_games === 0) return 0;
    return Math.round((this.wins / this.total_games) * 10000) / 100;
  }
}

// ==================== TournamentRank ====================
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

// ==================== TournamentRound ====================
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

// ==================== ScoringRule ====================
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

// ==================== Tournament ====================
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

  @Column({ type: 'text', nullable: true })
  sponsor_logos: string; // JSON array

  @Column({ type: 'text', nullable: true })
  ranks: string; // JSON array

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
  semi_final: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  final: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== TournamentRegistration ====================
@Entity('tournament_registrations')
export class TournamentRegistrationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tournament_id: number;

  @Column()
  user_id: number;

  @CreateDateColumn()
  registered_at: Date;

  @ManyToOne(() => TournamentEntity)
  @JoinColumn({ name: 'tournament_id' })
  tournament: TournamentEntity;

  @ManyToOne(() => PoolArenaUserEntity)
  @JoinColumn({ name: 'user_id' })
  user: PoolArenaUserEntity;
}

// ==================== TournamentMatch ====================
@Entity('tournament_matches')
export class TournamentMatchEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tournament_id: number;

  @Column({ type: 'int' })
  match_no: number;

  @Column({ type: 'varchar', length: 20 })
  bracket: string;

  @Column({ type: 'int', default: 1 })
  round: number;

  @Column({ nullable: true })
  player1_id: number;

  @Column({ nullable: true })
  player2_id: number;

  @Column({ type: 'int', default: 0 })
  player1_score: number;

  @Column({ type: 'int', default: 0 })
  player2_score: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  table_no: string;

  @Column({ type: 'timestamp', nullable: true })
  match_time: Date;

  @Column({ type: 'varchar', length: 20, default: 'upcoming' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'unconfirmed' })
  player1_check_in: string;

  @Column({ type: 'varchar', length: 20, default: 'unconfirmed' })
  player2_check_in: string;

  @Column({ nullable: true })
  winner_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TournamentEntity)
  @JoinColumn({ name: 'tournament_id' })
  tournament: TournamentEntity;

  @ManyToOne(() => PoolArenaUserEntity)
  @JoinColumn({ name: 'player1_id' })
  player1: PoolArenaUserEntity;

  @ManyToOne(() => PoolArenaUserEntity)
  @JoinColumn({ name: 'player2_id' })
  player2: PoolArenaUserEntity;

  @ManyToOne(() => PoolArenaUserEntity)
  @JoinColumn({ name: 'winner_id' })
  winner: PoolArenaUserEntity;
}
