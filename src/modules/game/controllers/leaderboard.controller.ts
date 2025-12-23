import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { LeaderboardService } from '../services/leaderboard.service';

@Controller('leaderboard')
@UseInterceptors(CacheInterceptor)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('top-winners')
  async getTopWinners(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopWinners(
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get('top-earners')
  async getTopEarners(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopEarners(
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get('highest-wagered')
  async getHighestWagered(@Query('limit') limit?: string) {
    return this.leaderboardService.getHighestWagered(
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get('recent-winners')
  async getRecentWinners(@Query('limit') limit?: string) {
    return this.leaderboardService.getRecentWinners(
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
