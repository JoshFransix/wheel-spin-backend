import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, PlayerEntity, RoomEntity } from '@/database/entities';
import { ContractService } from '@/modules/blockchain/services/contract.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PlayerEntity)
    private playerRepository: Repository<PlayerEntity>,
    private contractService: ContractService,
  ) {}

  async getUserProfile(address: string) {
    const user = await this.userRepository.findOne({
      where: { walletAddress: address.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException(`User ${address} not found`);
    }

    return {
      address: user.walletAddress,
      nickname: user.nickname,
      totalGamesPlayed: user.totalGamesPlayed,
      totalGamesWon: user.totalGamesWon,
      winRate: user.winRate,
      totalWagered: user.totalWagered,
      totalWageredEth: this.contractService.formatEther(user.totalWagered),
      totalWinnings: user.totalWinnings,
      totalWinningsEth: this.contractService.formatEther(user.totalWinnings),
      lastActivityAt: user.lastActivityAt,
      createdAt: user.createdAt,
    };
  }

  async getUserStats(address: string) {
    const user = await this.userRepository.findOne({
      where: { walletAddress: address.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException(`User ${address} not found`);
    }

    const netProfit = BigInt(user.totalWinnings) - BigInt(user.totalWagered);

    return {
      gamesPlayed: user.totalGamesPlayed,
      gamesWon: user.totalGamesWon,
      gamesLost: user.totalGamesPlayed - user.totalGamesWon,
      winRate: user.winRate,
      totalWagered: user.totalWagered,
      totalWageredEth: this.contractService.formatEther(user.totalWagered),
      totalWinnings: user.totalWinnings,
      totalWinningsEth: this.contractService.formatEther(user.totalWinnings),
      netProfit: netProfit.toString(),
      netProfitEth: this.contractService.formatEther(netProfit.toString()),
      roi: user.totalWagered !== '0' 
        ? ((Number(netProfit) / Number(user.totalWagered)) * 100).toFixed(2)
        : '0',
    };
  }

  async getUserGameHistory(address: string, options: { limit: number; offset: number }) {
    const players = await this.playerRepository.find({
      where: { userAddress: address.toLowerCase() },
      relations: ['room'],
      order: { joinedAt: 'DESC' },
      take: options.limit,
      skip: options.offset,
    });

    const total = await this.playerRepository.count({
      where: { userAddress: address.toLowerCase() },
    });

    return {
      data: players.map((player) => ({
        roomId: player.room.chainRoomId,
        roomSize: player.room.roomSize,
        betAmount: player.room.betAmount,
        betAmountEth: this.contractService.formatEther(player.room.betAmount),
        characterId: player.characterId,
        position: player.position,
        isWinner: player.isWinner,
        payout: player.isWinner ? player.room.payout : '0',
        payoutEth: player.isWinner ? this.contractService.formatEther(player.room.payout) : '0',
        status: player.room.status,
        joinedAt: player.joinedAt,
        completedAt: player.room.completedAt,
      })),
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
      },
    };
  }
}
