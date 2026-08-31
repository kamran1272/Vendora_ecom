import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum ImageType {
  THUMBNAIL = 'thumbnail',
  FEATURED = 'featured',
  GALLERY = 'gallery',
}

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'simple-enum',
    enum: ImageType,
    default: ImageType.GALLERY,
  })
  type: ImageType;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
