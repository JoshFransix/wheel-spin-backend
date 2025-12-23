import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { PlayerEntity } from './player.entity';
import { BetEntity } from './bet.entity';

@Entity('users')
@Index(['walletAddress'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 42, unique: true })
  @Index()
  walletAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname: string;

  @Column({ type: 'int', default: 0 })
  totalGamesPlayed: number;

  @Column({ type: 'int', default: 0 })
  totalGamesWon: number;

  @Column({ type: 'decimal', precision: 78, scale: 0, default: '0' })
  totalWagered: string; // in wei

  @Column({ type: 'decimal', precision: 78, scale: 0, default: '0' })
  totalWinnings: string; // in wei

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  winRate: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PlayerEntity, (player) => player.user)
  players: PlayerEntity[];

  @OneToMany(() => BetEntity, (bet) => bet.user)
  bets: BetEntity[];
}
