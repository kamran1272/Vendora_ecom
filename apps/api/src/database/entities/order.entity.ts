import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { SellerProfile } from './seller-profile.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  order_number: string;

  @Column({ type: 'uuid' })
  customer_id: string;

  @Column({ type: 'uuid' })
  seller_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shipping_cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount: number;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  order_status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  shipping_address: string;

  @Column({ type: 'text', nullable: true })
  billing_address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tracking_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  shipped_at: Date;

  @Column({ type: 'datetime', nullable: true })
  delivered_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => SellerProfile)
  @JoinColumn({ name: 'seller_id' })
  seller: SellerProfile;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: false,
  })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order, {
    cascade: true,
    eager: false,
  })
  payment: Payment;
}
