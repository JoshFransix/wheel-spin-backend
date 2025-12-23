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

@Entity('players')
@Index(['roomId', 'userAddress'])
@Index(['roomId', 'characterId'])
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  roomId: string;

  @Column({ type: 'varchar', length: 42 })
  @Index()
  userAddress: string;

  @Column({ type: 'int' })
  characterId: number;

  @Column({ type: 'varchar', length: 100 })
  nickname: string;

  @Column({ type: 'int' })
  position: number; // Position in the room (0-based)

  @Column({ type: 'boolean', default: false })
  isWinner: boolean;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @CreateDateColumn()
  indexedAt: Date;

  @ManyToOne(() => RoomEntity, (room) => room.players, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @ManyToOne(() => UserEntity, (user) => user.players, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userAddress', referencedColumnName: 'walletAddress' })
  user: UserEntity;
}
