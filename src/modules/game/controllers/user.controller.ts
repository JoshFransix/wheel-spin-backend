import { Controller, Get, Param, Query, UseInterceptors, CacheInterceptor } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':address')
  async getUserProfile(@Param('address') address: string) {
    return this.userService.getUserProfile(address);
  }

  @Get(':address/stats')
  async getUserStats(@Param('address') address: string) {
    return this.userService.getUserStats(address);
  }

  @Get(':address/history')
  async getUserGameHistory(
    @Param('address') address: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.userService.getUserGameHistory(address, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }
}
