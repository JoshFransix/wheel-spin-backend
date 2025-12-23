import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { RoomService } from '../services/room.service';

@Controller('rooms')
@UseInterceptors(CacheInterceptor)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getActiveRooms(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.roomService.getActiveRooms({
      status: status as any,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get(':roomId')
  async getRoomDetails(@Param('roomId') roomId: string) {
    return this.roomService.getRoomDetails(roomId);
  }

  @Get(':roomId/players')
  async getRoomPlayers(@Param('roomId') roomId: string) {
    return this.roomService.getRoomPlayers(roomId);
  }

  @Get('history/completed')
  async getCompletedGames(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.roomService.getCompletedGames({
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }
}
