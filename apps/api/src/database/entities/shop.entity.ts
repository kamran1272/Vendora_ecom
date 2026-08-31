import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SellerProfile } from './seller-profile.entity';
import { Product } from './product.entity';

export enum ShopStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  seller_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postal_code: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'integer', default: 0 })
  review_count: number;

  @Column({
    type: 'simple-enum',
    enum: ShopStatus,
    default: ShopStatus.ACTIVE,
  })
  status: ShopStatus;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => SellerProfile, (seller) => seller.shops)
  @JoinColumn({ name: 'seller_id' })
  seller: SellerProfile;

  @OneToMany(() => Product, (product) => product.shop)
  products: Product[];
}
