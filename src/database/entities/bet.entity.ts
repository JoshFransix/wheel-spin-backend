import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { RoomEntity } from './room.entity';

@Entity('bets')
@Index(['userAddress', 'roomId'], { unique: true })
@Index(['transactionHash'])
export class BetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  roomId: string;

  @Column({ type: 'varchar', length: 42 })
  @Index()
  userAddress: string;

  @Column({ type: 'decimal', precision: 78, scale: 0 })
  amount: string; // in wei

  @Column({ type: 'int' })
  characterId: number;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  transactionHash: string;

  @Column({ type: 'bigint' })
  blockNumber: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  indexedAt: Date;

  @ManyToOne(() => RoomEntity, (room) => room.bets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @ManyToOne(() => UserEntity, (user) => user.bets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userAddress', referencedColumnName: 'walletAddress' })
  user: UserEntity;
}
