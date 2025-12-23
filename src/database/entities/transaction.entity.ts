import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoomEntity } from './room.entity';

export enum TransactionType {
  BET = 'BET',
  PAYOUT = 'PAYOUT',
  FEE_COLLECTION = 'FEE_COLLECTION',
}

@Entity('transactions')
@Index(['transactionHash'], { unique: true })
@Index(['type'])
@Index(['timestamp'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 66, unique: true })
  @Index()
  transactionHash: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  @Index()
  type: TransactionType;

  @Column({ type: 'uuid', nullable: true })
  roomId: string;

  @Column({ type: 'varchar', length: 42 })
  @Index()
  fromAddress: string;

  @Column({ type: 'varchar', length: 42, nullable: true })
  toAddress: string;

  @Column({ type: 'decimal', precision: 78, scale: 0 })
  amount: string; // in wei

  @Column({ type: 'bigint' })
  @Index()
  blockNumber: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @Column({ type: 'varchar', length: 10 })
  status: string; // 'success' or 'failed'

  @CreateDateColumn()
  indexedAt: Date;

  @ManyToOne(() => RoomEntity, (room) => room.transactions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;
}
