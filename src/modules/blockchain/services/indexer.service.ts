import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContractService } from './contract.service';
import { EventGateway } from '@/modules/events/event.gateway';
import {
  RoomEntity,
  PlayerEntity,
  BetEntity,
  TransactionEntity,
  UserEntity,
  IndexerStateEntity,
  RoomStatus,
  TransactionType,
} from '@/database/entities';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private isIndexing = false;
  private lastProcessedBlock: number;

  constructor(
    private contractService: ContractService,
    private configService: ConfigService,
    private eventGateway: EventGateway,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(PlayerEntity)
    private playerRepository: Repository<PlayerEntity>,
    @InjectRepository(BetEntity)
    private betRepository: Repository<BetEntity>,
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(IndexerStateEntity)
    private indexerStateRepository: Repository<IndexerStateEntity>,
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<boolean>('indexer.enabled');
    if (enabled) {
      await this.initialize();
      this.logger.log('Indexer service initialized');
    } else {
      this.logger.warn('Indexer is disabled');
    }
  }

  private async initialize() {
    // Load last processed block from database
    const lastBlock = await this.getLastProcessedBlock();
    const deploymentBlock = this.configService.get<number>('blockchain.contractDeploymentBlock') || 0;
    
    this.lastProcessedBlock = lastBlock || deploymentBlock;
    this.logger.log(`Starting from block ${this.lastProcessedBlock}`);

    // Start listening to real-time events
    this.setupEventListeners();
  }

  private async getLastProcessedBlock(): Promise<number | null> {
    try {
      const state = await this.indexerStateRepository.findOne({
        where: { key: 'last_indexed_block' },
      });
      return state ? parseInt(state.value, 10) : null;
    } catch (error) {
      // If table doesn't exist yet (first run before migrations), return null
      if (error.code === '42P01') {
        this.logger.warn('indexer_state table does not exist yet. Run migrations first.');
        return null;
      }
      throw error;
    }
  }

  private async setLastProcessedBlock(blockNumber: number) {
    await this.indexerStateRepository.save({
      key: 'last_indexed_block',
      value: blockNumber.toString(),
    });
    this.lastProcessedBlock = blockNumber;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async indexHistoricalBlocks() {
    if (this.isIndexing) {
      return;
    }

    this.isIndexing = true;

    try {
      const currentBlock = await this.contractService.getCurrentBlock();
      const confirmBlocks = this.configService.get<number>('indexer.confirmBlocks') || 3;
      const safeBlock = currentBlock - confirmBlocks;

      if (this.lastProcessedBlock >= safeBlock) {
        this.isIndexing = false;
        return;
      }

      const batchSize = this.configService.get<number>('indexer.blockBatchSize') || 1000;
      const toBlock = Math.min(this.lastProcessedBlock + batchSize, safeBlock);

      this.logger.log(`Indexing blocks ${this.lastProcessedBlock} to ${toBlock}`);

      await this.processBlocks(this.lastProcessedBlock + 1, toBlock);
      await this.setLastProcessedBlock(toBlock);

      this.logger.log(`Successfully indexed up to block ${toBlock}`);
    } catch (error) {
      this.logger.error(`Error indexing blocks: ${error.message}`, error.stack);
    } finally {
      this.isIndexing = false;
    }
  }

  private async processBlocks(fromBlock: number, toBlock: number) {
    const contract = this.contractService.getContract();

    // Fetch all relevant events in this block range
    const events = {
      RoomCreated: await contract.queryFilter('RoomCreated', fromBlock, toBlock),
      PlayerJoined: await contract.queryFilter('PlayerJoined', fromBlock, toBlock),
      GameStarted: await contract.queryFilter('GameStarted', fromBlock, toBlock),
      RandomnessRequested: await contract.queryFilter('RandomnessRequested', fromBlock, toBlock),
      GameCompleted: await contract.queryFilter('GameCompleted', fromBlock, toBlock),
      NicknameSet: await contract.queryFilter('NicknameSet', fromBlock, toBlock),
    };

    // Process events in chronological order
    const allEvents = [
      ...events.RoomCreated.map(e => ({ type: 'RoomCreated', event: e })),
      ...events.PlayerJoined.map(e => ({ type: 'PlayerJoined', event: e })),
      ...events.GameStarted.map(e => ({ type: 'GameStarted', event: e })),
      ...events.RandomnessRequested.map(e => ({ type: 'RandomnessRequested', event: e })),
      ...events.GameCompleted.map(e => ({ type: 'GameCompleted', event: e })),
      ...events.NicknameSet.map(e => ({ type: 'NicknameSet', event: e })),
    ].sort((a, b) => {
      if (a.event.blockNumber !== b.event.blockNumber) {
        return a.event.blockNumber - b.event.blockNumber;
      }
      return a.event.index - b.event.index;
    });

    for (const { type, event } of allEvents) {
      await this.processEvent(type, event);
    }
  }

  private async processEvent(type: string, event: any) {
    try {
      switch (type) {
        case 'RoomCreated':
          await this.handleRoomCreated(event);
          break;
        case 'PlayerJoined':
          await this.handlePlayerJoined(event);
          break;
        case 'GameStarted':
          await this.handleGameStarted(event);
          break;
        case 'RandomnessRequested':
          await this.handleRandomnessRequested(event);
          break;
        case 'GameCompleted':
          await this.handleGameCompleted(event);
          break;
        case 'NicknameSet':
          await this.handleNicknameSet(event);
          break;
      }
    } catch (error) {
      this.logger.error(`Error processing ${type} event: ${error.message}`, error.stack);
    }
  }

  private async handleRoomCreated(event: any) {
    const { roomId, roomSize, betAmount, timestamp } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = event.blockNumber;

    // Check if already indexed (idempotency)
    const existing = await this.roomRepository.findOne({
      where: { chainRoomId: roomId.toString() },
    });

    if (existing) {
      return;
    }

    const room = this.roomRepository.create({
      chainRoomId: roomId.toString(),
      roomSize: Number(roomSize),
      betAmount: betAmount.toString(),
      status: RoomStatus.TO_FULLFILL,
      currentPlayers: 0,
      totalPot: '0',
      chainCreatedAt: new Date(Number(timestamp) * 1000),
    });

    await this.roomRepository.save(room);
    this.logger.log(`Room ${roomId} created`);

    // Emit WebSocket event
    this.eventGateway.emitRoomCreated(room);
  }

  private async handlePlayerJoined(event: any) {
    const { roomId, player, character, nickname, currentPlayers, timestamp } = event.args;
    const txHash = event.transactionHash;

    // Find room
    const room = await this.roomRepository.findOne({
      where: { chainRoomId: roomId.toString() },
    });

    if (!room) {
      this.logger.error(`Room ${roomId} not found`);
      return;
    }

    // Ensure user exists
    await this.ensureUserExists(player);

    // Check if player already added (idempotency)
    const existingPlayer = await this.playerRepository.findOne({
      where: {
        roomId: room.id,
        userAddress: player.toLowerCase(),
      },
    });

    if (existingPlayer) {
      return;
    }

    // Add player
    const playerEntity = this.playerRepository.create({
      roomId: room.id,
      userAddress: player.toLowerCase(),
      characterId: Number(character),
      nickname,
      position: Number(currentPlayers) - 1,
      joinedAt: new Date(Number(timestamp) * 1000),
    });

    await this.playerRepository.save(playerEntity);

    // Create bet record
    const bet = this.betRepository.create({
      roomId: room.id,
      userAddress: player.toLowerCase(),
      amount: room.betAmount,
      characterId: Number(character),
      transactionHash: txHash,
      blockNumber: event.blockNumber.toString(),
      timestamp: new Date(Number(timestamp) * 1000),
    });

    await this.betRepository.save(bet);

    // Update room
    room.currentPlayers = Number(currentPlayers);
    room.totalPot = (BigInt(room.totalPot) + BigInt(room.betAmount)).toString();
    await this.roomRepository.save(room);

    // Update user stats
    await this.updateUserStats(player.toLowerCase());

    this.logger.log(`Player ${player} joined room ${roomId}`);

    // Emit WebSocket event
    this.eventGateway.emitPlayerJoined(room.chainRoomId, playerEntity);
  }

  private async handleGameStarted(event: any) {
    const { roomId, totalPlayers, totalPot, timestamp } = event.args;

    const room = await this.roomRepository.findOne({
      where: { chainRoomId: roomId.toString() },
    });

    if (!room) {
      return;
    }

    room.status = RoomStatus.RUNNING;
    room.gameStartedAt = new Date(Number(timestamp) * 1000);
    await this.roomRepository.save(room);

    this.logger.log(`Game started for room ${roomId}`);
    this.eventGateway.emitGameStarted(room.chainRoomId);
  }

  private async handleRandomnessRequested(event: any) {
    const { roomId, requestId } = event.args;

    const room = await this.roomRepository.findOne({
      where: { chainRoomId: roomId.toString() },
    });

    if (!room) {
      return;
    }

    room.vrfRequestId = requestId.toString();
    await this.roomRepository.save(room);
  }

  private async handleGameCompleted(event: any) {
    const { roomId, winner, payout, feeAmount, timestamp } = event.args;

    const room = await this.roomRepository.findOne({
      where: { chainRoomId: roomId.toString() },
      relations: ['players'],
    });

    if (!room) {
      return;
    }

    room.status = RoomStatus.DONE;
    room.winnerAddress = winner.toLowerCase();
    room.payout = payout.toString();
    room.feeAmount = feeAmount.toString();
    room.completedAt = new Date(Number(timestamp) * 1000);
    await this.roomRepository.save(room);

    // Mark winner in players
    await this.playerRepository.update(
      { roomId: room.id, userAddress: winner.toLowerCase() },
      { isWinner: true },
    );

    // Update user stats
    await this.updateUserStats(winner.toLowerCase(), true);

    this.logger.log(`Game completed for room ${roomId}, winner: ${winner}`);
    this.eventGateway.emitGameCompleted(room.chainRoomId, winner.toLowerCase(), payout.toString());
  }

  private async handleNicknameSet(event: any) {
    const { player, nickname } = event.args;

    await this.userRepository.update(
      { walletAddress: player.toLowerCase() },
      { nickname },
    );
  }

  private async ensureUserExists(walletAddress: string) {
    const address = walletAddress.toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { walletAddress: address },
    });

    if (!existing) {
      const user = this.userRepository.create({
        walletAddress: address,
        lastActivityAt: new Date(),
      });
      await this.userRepository.save(user);
    }
  }

  private async updateUserStats(walletAddress: string, won = false) {
    const address = walletAddress.toLowerCase();
    const user = await this.userRepository.findOne({
      where: { walletAddress: address },
    });

    if (!user) {
      return;
    }

    const stats = await this.betRepository
      .createQueryBuilder('bet')
      .select('COUNT(*)', 'totalGames')
      .addSelect('SUM(CAST(bet.amount AS DECIMAL))', 'totalWagered')
      .where('bet.userAddress = :address', { address })
      .getRawOne();

    const wins = await this.playerRepository.count({
      where: { userAddress: address, isWinner: true },
    });

    const winnings = await this.roomRepository
      .createQueryBuilder('room')
      .select('SUM(CAST(room.payout AS DECIMAL))', 'total')
      .where('room.winnerAddress = :address', { address })
      .getRawOne();

    user.totalGamesPlayed = parseInt(stats.totalGames, 10) || 0;
    user.totalGamesWon = wins;
    user.totalWagered = stats.totalWagered || '0';
    user.totalWinnings = winnings.total || '0';
    user.winRate = user.totalGamesPlayed > 0 ? (wins / user.totalGamesPlayed) * 100 : 0;
    user.lastActivityAt = new Date();

    await this.userRepository.save(user);
  }

  private setupEventListeners() {
    const wsProvider = this.contractService.getWebSocketProvider();
    if (!wsProvider) {
      this.logger.warn('WebSocket provider not available for real-time events');
      return;
    }

    const contract = this.contractService.getContract().connect(wsProvider);

    contract.on('RoomCreated', (...args) => {
      this.handleRoomCreated({ args: args.slice(0, -1), transactionHash: args[args.length - 1].transactionHash, blockNumber: args[args.length - 1].blockNumber, index: args[args.length - 1].index });
    });

    contract.on('PlayerJoined', (...args) => {
      this.handlePlayerJoined({ args: args.slice(0, -1), transactionHash: args[args.length - 1].transactionHash, blockNumber: args[args.length - 1].blockNumber });
    });

    contract.on('GameStarted', (...args) => {
      this.handleGameStarted({ args: args.slice(0, -1) });
    });

    contract.on('GameCompleted', (...args) => {
      this.handleGameCompleted({ args: args.slice(0, -1) });
    });

    contract.on('NicknameSet', (...args) => {
      this.handleNicknameSet({ args: args.slice(0, -1) });
    });

    this.logger.log('Real-time event listeners configured');
  }
}
