import { registerAs } from '@nestjs/config';

export default registerAs('indexer', () => ({
  enabled: process.env.INDEXER_ENABLED !== 'false',
  blockBatchSize: parseInt(process.env.INDEXER_BLOCK_BATCH_SIZE, 10) || 1000,
  pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL, 10) || 12000,
  confirmBlocks: parseInt(process.env.INDEXER_CONFIRM_BLOCKS, 10) || 3,
  maxRetries: parseInt(process.env.INDEXER_MAX_RETRIES, 10) || 3,
}));
