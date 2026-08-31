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
import { SellerProfile } from './seller-profile.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('seller_wallets')
export class SellerWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  seller_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_earnings: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_withdrawn: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  pending_balance: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  // Relations
  @OneToOne(() => SellerProfile, (seller) => seller.wallet)
  @JoinColumn({ name: 'seller_id' })
  seller: SellerProfile;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.wallet, {
    cascade: false,
    eager: false,
  })
  transactions: WalletTransaction[];
}
