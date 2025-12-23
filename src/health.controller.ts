import { Controller, Get } from '@nestjs/common';
import { ContractService } from './modules/blockchain/services/contract.service';

@Controller('health')
export class HealthController {
  constructor(private contractService: ContractService) {}

  @Get()
  async check() {
    try {
      const blockNumber = await this.contractService.getCurrentBlock();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        blockchain: {
          connected: true,
          currentBlock: blockNumber,
          contract: process.env.CONTRACT_ADDRESS,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        blockchain: {
          connected: false,
          error: error.message,
        },
      };
    }
  }
}
