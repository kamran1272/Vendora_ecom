import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: CouponDiscountType,
    default: CouponDiscountType.PERCENTAGE,
  })
  discount_type: CouponDiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximum_discount: number; // For percentage discounts

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimum_purchase: number;

  @Column({ type: 'integer', nullable: true })
  usage_limit: number;

  @Column({ type: 'integer', default: 0 })
  usage_count: number;

  @Column({ type: 'integer', nullable: true })
  usage_limit_per_customer: number;

  @Column({
    type: 'simple-enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
