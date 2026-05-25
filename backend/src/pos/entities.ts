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

// ==================== Menu ====================
@Entity('menus')
export class MenuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'GamepadIcon' })
  icon: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'json', default: [] })
  product_ids: number[];

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== Product ====================
@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @Column({ type: 'varchar', length: 50, default: 'Tính tiền theo số lượng' })
  type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code: string;

  @Column({ type: 'float', nullable: true })
  sell_price: number;

  @Column({ type: 'float', nullable: true })
  cost_price: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  channels: any;

  @Column({ type: 'boolean', nullable: true, default: false })
  inventory_linked: boolean;

  @Column({ type: 'int', nullable: true })
  inventory_id: number;

  @Column({ type: 'boolean', nullable: true, default: true })
  show_on_scoreboard: boolean;

  @Column({ type: 'float', nullable: true })
  hourly_price: number;

  @Column({ type: 'int', nullable: true })
  time_interval_value: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  time_interval_unit: string;

  @Column({ type: 'boolean', nullable: true, default: false })
  first_hour_enabled: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  special_hour_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ==================== PosOrder ====================
@Entity('pos_orders')
export class PosOrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  table_id: number;

  @Column({ nullable: true })
  area_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  table_name: string;

  @Column({ type: 'int', nullable: true })
  table_number: number;

  @Column({ type: 'int', default: 1 })
  customer_count: number;

  @Column({ type: 'varchar', length: 50, default: 'dine-in' })
  order_type: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_info: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'float', default: 0 })
  total_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @OneToMany(() => PosOrderItemEntity, (item) => item.order, { cascade: true })
  items: PosOrderItemEntity[];
}

// ==================== PosOrderItem ====================
@Entity('pos_order_items')
export class PosOrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'boolean', default: false })
  is_time_based: boolean;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => PosOrderEntity, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: PosOrderEntity;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;
}
