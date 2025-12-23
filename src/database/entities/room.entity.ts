import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlayerEntity } from './player.entity';
import { BetEntity } from './bet.entity';
import { TransactionEntity } from './transaction.entity';

export enum RoomStatus {
  TO_FULLFILL = 0,
  RUNNING = 1,
  DONE = 2,
}

@Entity('rooms')
@Index(['chainRoomId'], { unique: true })
@Index(['status'])
@Index(['createdAt'])
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  @Index()
  chainRoomId: string; // Room ID from smart contract

  @Column({ type: 'int' })
  roomSize: number;

  @Column({ type: 'decimal', precision: 78, scale: 0 })
  betAmount: string; // in wei

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.TO_FULLFILL,
  })
  @Index()
  status: RoomStatus;

  @Column({ type: 'int', default: 0 })
  currentPlayers: number;

  @Column({ type: 'decimal', precision: 78, scale: 0, default: '0' })
  totalPot: string; // in wei

  @Column({ type: 'varchar', length: 42, nullable: true })
  @Index()
  winnerAddress: string;

  @Column({ type: 'decimal', precision: 78, scale: 0, nullable: true })
  payout: string; // in wei

  @Column({ type: 'decimal', precision: 78, scale: 0, nullable: true })
  feeAmount: string; // in wei

  @Column({ type: 'varchar', length: 66, nullable: true })
  vrfRequestId: string;

  @Column({ type: 'timestamp' })
  chainCreatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gameStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  indexedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PlayerEntity, (player) => player.room)
  players: PlayerEntity[];

  @OneToMany(() => BetEntity, (bet) => bet.room)
  bets: BetEntity[];

  @OneToMany(() => TransactionEntity, (tx) => tx.room)
  transactions: TransactionEntity[];
}
