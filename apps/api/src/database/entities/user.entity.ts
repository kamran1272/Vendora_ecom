import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { SellerProfile } from './seller-profile.entity';
import { Order } from './order.entity';
import { Review } from './review.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  avatar?: string | null;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole = UserRole.CUSTOMER;

  @Column({
    type: 'simple-enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus = UserStatus.ACTIVE;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  // Relations
  @OneToOne(() => SellerProfile, (seller) => seller.user, {
    nullable: true,
    eager: false,
  })
  seller_profile?: SellerProfile | null;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => Review, (review) => review.customer)
  reviews: Review[];
}
