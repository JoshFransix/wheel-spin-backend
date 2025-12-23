import { registerAs } from '@nestjs/config';

export default registerAs('indexer', () => ({
  enabled: process.env.INDEXER_ENABLED !== 'false',
  blockBatchSize: parseInt(process.env.INDEXER_BLOCK_BATCH_SIZE || '1000', 10),
  pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '12000', 10),
  confirmBlocks: parseInt(process.env.INDEXER_CONFIRM_BLOCKS || '3', 10),
  maxRetries: parseInt(process.env.INDEXER_MAX_RETRIES || '3', 10),
}));
