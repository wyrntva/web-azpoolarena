import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';

// We import CategoryEntity from inventory, but here we can just use category_id
import { CategoryEntity } from '../inventory/entities';

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
}

@Entity('receipt_types')
export class ReceiptTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_inventory: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;
}

@Entity('receipts')
export class ReceiptEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  receipt_date: string | Date;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'int' })
  receipt_type_id: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'boolean', default: false })
  is_income: boolean;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.CASH })
  payment_method: AccountType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => ReceiptTypeEntity)
  @JoinColumn({ name: 'receipt_type_id' })
  receipt_type: ReceiptTypeEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;
}

@Entity('revenues')
export class RevenueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  revenue_date: string | Date;

  @Column({ type: 'float', default: 0.0 })
  cash_revenue: number;

  @Column({ type: 'float', default: 0.0 })
  bank_revenue: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'int' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;
}

@Entity('exchanges')
export class ExchangeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  exchange_date: string | Date;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'enum', enum: AccountType })
  from_account: AccountType;

  @Column({ type: 'enum', enum: AccountType })
  to_account: AccountType;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'int' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;
}

@Entity('safes')
export class SafeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  safe_date: string | Date;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'int' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;
}

@Entity('debts')
export class DebtEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  debt_date: string | Date;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar', length: 100 })
  debtor_name: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;

  @Column({ type: 'date', nullable: true })
  paid_date: string | Date;

  @Column({ type: 'enum', enum: AccountType, nullable: true })
  payment_method: AccountType;

  @Column({ type: 'int' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;
}
