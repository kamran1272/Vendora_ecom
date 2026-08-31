import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Shop } from './shop.entity';
import { Product } from './product.entity';
import { SellerWallet } from './seller-wallet.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum IdentificationType {
  CNIC = 'cnic',
  DRIVING_LICENSE = 'driving_license',
  PASSPORT = 'passport',
}

@Entity('seller_profiles')
export class SellerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  shop_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ type: 'text', nullable: true })
  banner: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // KYC/Verification Documents
  @Column({
    type: 'simple-enum',
    enum: IdentificationType,
  })
  identification_type: IdentificationType;

  @Column({ type: 'varchar', length: 255 })
  identification_number: string;

  @Column({ type: 'text' })
  identification_front: string; // Document URL

  @Column({ type: 'text', nullable: true })
  identification_back: string; // Document URL (optional for passport)

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  // Seller Status
  @Column({
    type: 'simple-enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approval_status: ApprovalStatus;

  @Column({ type: 'float', default: 0 })
  commission_rate: number; // Percentage (e.g., 5 for 5%)

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.seller_profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Shop, (shop) => shop.seller)
  shops: Shop[];

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @OneToOne(() => SellerWallet, (wallet) => wallet.seller)
  wallet: SellerWallet;
}
