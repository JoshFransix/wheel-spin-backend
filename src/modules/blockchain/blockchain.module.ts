import { Module } from '@nestjs/common';
import { ContractService } from './services/contract.service';
import { IndexerService } from './services/indexer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  RoomEntity,
  PlayerEntity,
  BetEntity,
  TransactionEntity,
  UserEntity,
  IndexerStateEntity,
} from '@/database/entities';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomEntity,
      PlayerEntity,
      BetEntity,
      TransactionEntity,
      UserEntity,
      IndexerStateEntity,
    ]),
    EventsModule,
  ],
  providers: [ContractService, IndexerService],
  exports: [ContractService, IndexerService],
})
export class BlockchainModule {}
