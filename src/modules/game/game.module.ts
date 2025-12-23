import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  RoomEntity,
  PlayerEntity,
  BetEntity,
  UserEntity,
} from '@/database/entities';
import { RoomController } from './controllers/room.controller';
import { UserController } from './controllers/user.controller';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { RoomService } from './services/room.service';
import { UserService } from './services/user.service';
import { LeaderboardService } from './services/leaderboard.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomEntity,
      PlayerEntity,
      BetEntity,
      UserEntity,
    ]),
    BlockchainModule,
  ],
  controllers: [RoomController, UserController, LeaderboardController],
  providers: [RoomService, UserService, LeaderboardService],
  exports: [RoomService, UserService, LeaderboardService],
})
export class GameModule {}
