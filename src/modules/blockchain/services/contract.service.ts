import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider, WebSocketProvider, JsonRpcProvider } from 'ethers';
import { CONTRACT_ABI } from '@/common/constants/contract-abi';

@Injectable()
export class ContractService implements OnModuleInit {
  private readonly logger = new Logger(ContractService.name);
  private contract: Contract;
  private provider: Provider;
  private wsProvider: WebSocketProvider;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeProviders();
    await this.initializeContract();
  }

  private async initializeProviders() {
    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl');
    const wsUrl = this.configService.get<string>('blockchain.rpcWebsocketUrl');
    const fallbackUrl = this.configService.get<string>('blockchain.fallbackRpcUrl');

    if (!rpcUrl) {
      throw new Error('RPC_URL is not configured');
    }

    // Initialize HTTP provider for read operations
    this.provider = new JsonRpcProvider(rpcUrl);

    // Initialize WebSocket provider for event listening with auto-reconnect
    if (wsUrl) {
      this.wsProvider = new WebSocketProvider(wsUrl);
      this.setupWebSocketReconnection();
    } else {
      this.logger.warn('WebSocket URL not configured. Event listening may not work optimally.');
      this.wsProvider = null;
    }

    this.logger.log('Blockchain providers initialized');
  }

  private setupWebSocketReconnection() {
    this.wsProvider.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error.message}`);
      this.handleWebSocketReconnect();
    });

    this.wsProvider.on('close', () => {
      this.logger.warn('WebSocket connection closed');
      this.handleWebSocketReconnect();
    });
  }

  private async handleWebSocketReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max WebSocket reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.logger.log(`Attempting WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        const wsUrl = this.configService.get<string>('blockchain.rpcWebsocketUrl');
        this.wsProvider = new WebSocketProvider(wsUrl);
        this.setupWebSocketReconnection();
        this.logger.log('WebSocket reconnected successfully');
        this.reconnectAttempts = 0;
      } catch (error) {
        this.logger.error(`WebSocket reconnection failed: ${error.message}`);
        this.handleWebSocketReconnect();
      }
    }, delay);
  }

  private async initializeContract() {
    const contractAddress = this.configService.get<string>('blockchain.contractAddress');

    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('CONTRACT_ADDRESS is not configured');
    }

    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.provider);
    this.logger.log(`Contract initialized at ${contractAddress}`);
  }

  getContract(): Contract {
    return this.contract;
  }

  getProvider(): Provider {
    return this.provider;
  }

  getWebSocketProvider(): WebSocketProvider | null {
    return this.wsProvider;
  }

  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getRoomInfo(roomId: string | number) {
    try {
      const [roomSize, betAmount, status, currentPlayers, totalPot, winner, players] =
        await this.contract.getRoomInfo(roomId);

      return {
        roomSize,
        betAmount: betAmount.toString(),
        status,
        currentPlayers,
        totalPot: totalPot.toString(),
        winner,
        players,
      };
    } catch (error) {
      this.logger.error(`Error fetching room info for room ${roomId}: ${error.message}`);
      throw error;
    }
  }

  async getPlayersInRoom(roomId: string | number) {
    try {
      const players = await this.contract.getCaracterInRoom(roomId);
      return players.map((player: any) => ({
        wallet: player.wallet,
        character: player.character,
        nickname: player.nickname,
        joinedAt: new Date(Number(player.joinedAt) * 1000),
      }));
    } catch (error) {
      this.logger.error(`Error fetching players for room ${roomId}: ${error.message}`);
      throw error;
    }
  }

  async getCurrentRoomId(): Promise<string> {
    try {
      const roomId = await this.contract.getCurrentRoomId();
      return roomId.toString();
    } catch (error) {
      this.logger.error(`Error fetching current room ID: ${error.message}`);
      throw error;
    }
  }

  async getAccumulatedFees(): Promise<string> {
    try {
      const fees = await this.contract.accumulatedFees();
      return fees.toString();
    } catch (error) {
      this.logger.error(`Error fetching accumulated fees: ${error.message}`);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      this.logger.error(`Error fetching transaction receipt: ${error.message}`);
      throw error;
    }
  }

  async getBlock(blockNumber: number) {
    try {
      return await this.provider.getBlock(blockNumber);
    } catch (error) {
      this.logger.error(`Error fetching block ${blockNumber}: ${error.message}`);
      throw error;
    }
  }

  formatEther(wei: string | bigint): string {
    return ethers.formatEther(wei);
  }

  parseEther(ether: string): bigint {
    return ethers.parseEther(ether);
  }
}
