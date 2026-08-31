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
import { Shop } from './shop.entity';
import { Category } from './category.entity';
import { Brand } from './brand.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { OrderItem } from './order-item.entity';
import { Review } from './review.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  seller_id: string;

  @Column({ type: 'uuid', nullable: true })
  shop_id: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'uuid', nullable: true })
  brand_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  technical_details: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount_price: number;

  @Column({ type: 'integer', default: 0 })
  discount_percentage: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @Column({ type: 'integer', default: 0 })
  sold_count: number;

  @Column({ type: 'float', default: 0 })
  average_rating: number;

  @Column({ type: 'integer', default: 0 })
  review_count: number;

  @Column({
    type: 'simple-enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => SellerProfile, (seller) => seller.products)
  @JoinColumn({ name: 'seller_id' })
  seller: SellerProfile;

  @ManyToOne(() => Shop, (shop) => shop.products)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
    eager: false,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: false,
  })
  images: ProductImage[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  order_items: OrderItem[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];
}
