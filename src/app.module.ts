import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { dataSourceOptions } from './config/typeorm.config';
import databaseConfig from './config/database.config';
import blockchainConfig from './config/blockchain.config';
import indexerConfig from './config/indexer.config';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { GameModule } from './modules/game/game.module';
import { EventsModule } from './modules/events/events.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, blockchainConfig, indexerConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRoot(dataSourceOptions),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.API_CACHE_TTL, 10) * 1000 || 30000,
      max: 100,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.API_RATE_LIMIT_TTL, 10) * 1000 || 60000,
        limit: parseInt(process.env.API_RATE_LIMIT_LIMIT, 10) || 100,
      },
    ]),

    // Scheduling (for indexer cron jobs)
    ScheduleModule.forRoot(),

    // Feature Modules
    BlockchainModule,
    GameModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
