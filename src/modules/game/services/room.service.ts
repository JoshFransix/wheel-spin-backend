import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomEntity, RoomStatus, PlayerEntity } from '@/database/entities';
import { ContractService } from '@/modules/blockchain/services/contract.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(PlayerEntity)
    private playerRepository: Repository<PlayerEntity>,
    private contractService: ContractService,
  ) {}

  async getActiveRooms(options: { status?: RoomStatus; limit: number; offset: number }) {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.players', 'players')
      .orderBy('room.createdAt', 'DESC')
      .take(options.limit)
      .skip(options.offset);

    if (options.status !== undefined) {
      query.where('room.status = :status', { status: options.status });
    } else {
      query.where('room.status IN (:...statuses)', {
        statuses: [RoomStatus.TO_FULLFILL, RoomStatus.RUNNING],
      });
    }

    const [rooms, total] = await query.getManyAndCount();

    return {
      data: rooms.map((room) => this.formatRoomResponse(room)),
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
      },
    };
  }

  async getRoomDetails(chainRoomId: string) {
    const room = await this.roomRepository.findOne({
      where: { chainRoomId },
      relations: ['players', 'players.user'],
    });

    if (!room) {
      throw new NotFoundException(`Room ${chainRoomId} not found`);
    }

    return this.formatRoomResponse(room, true);
  }

  async getRoomPlayers(chainRoomId: string) {
    const room = await this.roomRepository.findOne({
      where: { chainRoomId },
    });

    if (!room) {
      throw new NotFoundException(`Room ${chainRoomId} not found`);
    }

    const players = await this.playerRepository.find({
      where: { roomId: room.id },
      relations: ['user'],
      order: { position: 'ASC' },
    });

    return players.map((player) => ({
      address: player.userAddress,
      characterId: player.characterId,
      nickname: player.nickname,
      position: player.position,
      isWinner: player.isWinner,
      joinedAt: player.joinedAt,
    }));
  }

  async getCompletedGames(options: { limit: number; offset: number }) {
    const [rooms, total] = await this.roomRepository.findAndCount({
      where: { status: RoomStatus.DONE },
      relations: ['players'],
      order: { completedAt: 'DESC' },
      take: options.limit,
      skip: options.offset,
    });

    return {
      data: rooms.map((room) => this.formatRoomResponse(room)),
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
      },
    };
  }

  private formatRoomResponse(room: RoomEntity, detailed = false) {
    const response: any = {
      roomId: room.chainRoomId,
      roomSize: room.roomSize,
      betAmount: room.betAmount,
      betAmountEth: this.contractService.formatEther(room.betAmount),
      status: this.getRoomStatusString(room.status),
      currentPlayers: room.currentPlayers,
      totalPot: room.totalPot,
      totalPotEth: this.contractService.formatEther(room.totalPot),
      createdAt: room.chainCreatedAt,
      gameStartedAt: room.gameStartedAt,
      completedAt: room.completedAt,
    };

    if (room.status === RoomStatus.DONE) {
      response.winner = room.winnerAddress;
      response.payout = room.payout;
      response.payoutEth = this.contractService.formatEther(room.payout);
      response.feeAmount = room.feeAmount;
    }

    if (detailed && room.players) {
      response.players = room.players.map((player) => ({
        address: player.userAddress,
        characterId: player.characterId,
        nickname: player.nickname,
        position: player.position,
        isWinner: player.isWinner,
        joinedAt: player.joinedAt,
      }));
    }

    return response;
  }

  private getRoomStatusString(status: RoomStatus): string {
    switch (status) {
      case RoomStatus.TO_FULLFILL:
        return 'WAITING_FOR_PLAYERS';
      case RoomStatus.RUNNING:
        return 'IN_PROGRESS';
      case RoomStatus.DONE:
        return 'COMPLETED';
      default:
        return 'UNKNOWN';
    }
  }
}
