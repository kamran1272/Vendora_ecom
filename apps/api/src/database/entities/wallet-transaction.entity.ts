import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SellerWallet } from './seller-wallet.entity';

export enum TransactionType {
  SALE = 'sale', // +amount
  COMMISSION = 'commission', // -amount
  WITHDRAWAL = 'withdrawal', // -amount
  REFUND = 'refund', // +amount
  ADJUSTMENT = 'adjustment', // +/- amount
  PAYOUT = 'payout', // -amount
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  seller_id: string;

  @Column({
    type: 'simple-enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference_id: string; // Order ID, Withdrawal ID, etc.

  @Column({ type: 'uuid', nullable: true })
  reference_order_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balance_before: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balance_after: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  processed_at: Date;

  // Relations
  @ManyToOne(() => SellerWallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'seller_id' })
  wallet: SellerWallet;
}
