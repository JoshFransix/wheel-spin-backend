import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  chainId: parseInt(process.env.CHAIN_ID, 10) || 11155111,
  rpcUrl: process.env.RPC_URL,
  rpcWebsocketUrl: process.env.RPC_WEBSOCKET_URL,
  fallbackRpcUrl: process.env.FALLBACK_RPC_URL,
  contractAddress: process.env.CONTRACT_ADDRESS,
  contractDeploymentBlock: parseInt(process.env.CONTRACT_DEPLOYMENT_BLOCK, 10) || 0,
}));
