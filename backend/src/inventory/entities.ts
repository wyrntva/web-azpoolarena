import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';

// Enums
export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  LOW_STOCK = 'low_stock',
}

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
}

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
}

// Entities
@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => InventoryEntity, (inv) => inv.category)
  inventories: InventoryEntity[];
}

@Entity('units')
export class UnitEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('inventories')
export class InventoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  product_name: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  min_quantity: number;

  @Column({ type: 'int' })
  category_id: number;

  @Column({ type: 'int' })
  base_unit_id: number;

  @Column({ type: 'int', nullable: true })
  conversion_unit_id: number;

  @Column({ type: 'int', nullable: true })
  conversion_rate: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.IN_STOCK,
  })
  status: InventoryStatus;

  @Column({ type: 'int' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'base_unit_id' })
  base_unit_ref: UnitEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'conversion_unit_id' })
  conversion_unit_ref: UnitEntity;
}

@Entity('inventory_transactions')
export class InventoryTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  transaction_date: string | Date;

  @Column({ type: 'enum', enum: TransactionType })
  transaction_type: TransactionType;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'int' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity;

  @OneToMany(
    () => InventoryTransactionDetailEntity,
    (detail) => detail.transaction,
    { cascade: true },
  )
  details: InventoryTransactionDetailEntity[];
}

@Entity('inventory_transaction_details')
export class InventoryTransactionDetailEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  transaction_id: number;

  @Column({ type: 'int' })
  inventory_id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 20, default: 'base' })
  unit_type: string;

  @Column({ type: 'float', nullable: true })
  price: number;

  @Column({ type: 'enum', enum: AccountType, nullable: true })
  payment_method: AccountType;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => InventoryTransactionEntity, (tx) => tx.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: InventoryTransactionEntity;

  @ManyToOne(() => InventoryEntity)
  @JoinColumn({ name: 'inventory_id' })
  inventory: InventoryEntity;
}
