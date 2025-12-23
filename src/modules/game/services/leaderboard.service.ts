import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, RoomEntity, RoomStatus } from '@/database/entities';
import { ContractService } from '@/modules/blockchain/services/contract.service';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    private contractService: ContractService,
  ) {}

  async getTopWinners(limit: number) {
    const users = await this.userRepository.find({
      where: { totalGamesWon: require('typeorm').MoreThan(0) },
      order: { totalGamesWon: 'DESC' },
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      address: user.walletAddress,
      nickname: user.nickname,
      gamesWon: user.totalGamesWon,
      gamesPlayed: user.totalGamesPlayed,
      winRate: user.winRate,
      totalWinnings: user.totalWinnings,
      totalWinningsEth: this.contractService.formatEther(user.totalWinnings),
    }));
  }

  async getTopEarners(limit: number) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('CAST(user.totalWinnings AS DECIMAL) > 0')
      .orderBy('CAST(user.totalWinnings AS DECIMAL)', 'DESC')
      .take(limit)
      .getMany();

    return users.map((user, index) => ({
      rank: index + 1,
      address: user.walletAddress,
      nickname: user.nickname,
      totalWinnings: user.totalWinnings,
      totalWinningsEth: this.contractService.formatEther(user.totalWinnings),
      totalWagered: user.totalWagered,
      totalWageredEth: this.contractService.formatEther(user.totalWagered),
      netProfit: (BigInt(user.totalWinnings) - BigInt(user.totalWagered)).toString(),
      netProfitEth: this.contractService.formatEther(
        (BigInt(user.totalWinnings) - BigInt(user.totalWagered)).toString(),
      ),
    }));
  }

  async getHighestWagered(limit: number) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('CAST(user.totalWagered AS DECIMAL) > 0')
      .orderBy('CAST(user.totalWagered AS DECIMAL)', 'DESC')
      .take(limit)
      .getMany();

    return users.map((user, index) => ({
      rank: index + 1,
      address: user.walletAddress,
      nickname: user.nickname,
      totalWagered: user.totalWagered,
      totalWageredEth: this.contractService.formatEther(user.totalWagered),
      gamesPlayed: user.totalGamesPlayed,
      gamesWon: user.totalGamesWon,
    }));
  }

  async getRecentWinners(limit: number) {
    const rooms = await this.roomRepository.find({
      where: { status: RoomStatus.DONE },
      order: { completedAt: 'DESC' },
      take: limit,
    });

    return rooms.map((room) => ({
      roomId: room.chainRoomId,
      winner: room.winnerAddress,
      payout: room.payout,
      payoutEth: this.contractService.formatEther(room.payout),
      betAmount: room.betAmount,
      roomSize: room.roomSize,
      completedAt: room.completedAt,
    }));
  }
}
