# Spin The Wheel - Backend

Web3 backend for the Spin The Wheel multiplayer gambling game built with NestJS, PostgreSQL, WebSockets, and Ethers.js.

## Architecture

### Core Principles
- **Read-Only**: Backend never mutates game logic or outcomes
- **Blockchain as Source of Truth**: All authoritative state comes from the smart contract
- **Event-Driven**: Indexes on-chain events and provides real-time updates

### Tech Stack
- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Real-time**: Socket.IO WebSockets
- **Blockchain**: Ethers.js v6
- **Caching**: In-memory cache (expandable to Redis)
- **Contract**: Chainlink VRF v2.5 on Sepolia

## Project Structure

```
src/
├── config/                      # Configuration files
│   ├── database.config.ts
│   ├── blockchain.config.ts
│   ├── indexer.config.ts
│   └── typeorm.config.ts
├── database/
│   ├── entities/                # TypeORM entities
│   │   ├── user.entity.ts       # User profiles & stats
│   │   ├── room.entity.ts       # Game rooms
│   │   ├── player.entity.ts     # Players in rooms
│   │   ├── bet.entity.ts        # Bet records
│   │   ├── transaction.entity.ts
│   │   └── indexer-state.entity.ts
│   └── migrations/              # Database migrations
├── modules/
│   ├── blockchain/              # Contract interaction & indexing
│   │   ├── services/
│   │   │   ├── contract.service.ts    # Contract read operations
│   │   │   └── indexer.service.ts     # Event indexing
│   │   └── blockchain.module.ts
│   ├── game/                    # Game API
│   │   ├── controllers/
│   │   │   ├── room.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── leaderboard.controller.ts
│   │   ├── services/
│   │   │   ├── room.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── leaderboard.service.ts
│   │   └── game.module.ts
│   └── events/                  # WebSocket gateway
│       ├── event.gateway.ts
│       └── events.module.ts
├── common/
│   └── constants/
│       └── contract-abi.ts      # Smart contract ABI
├── app.module.ts
├── main.ts
└── health.controller.ts

```

## Database Schema

### Users Table
```sql
- id (UUID)
- walletAddress (VARCHAR(42), UNIQUE, INDEXED)
- nickname (VARCHAR(100))
- totalGamesPlayed (INT)
- totalGamesWon (INT)
- totalWagered (DECIMAL)
- totalWinnings (DECIMAL)
- winRate (DECIMAL)
- lastActivityAt (TIMESTAMP)
- createdAt, updatedAt
```

### Rooms Table
```sql
- id (UUID)
- chainRoomId (BIGINT, UNIQUE, INDEXED) -- from smart contract
- roomSize (INT)
- betAmount (DECIMAL)
- status (ENUM: TO_FULLFILL, RUNNING, DONE)
- currentPlayers (INT)
- totalPot (DECIMAL)
- winnerAddress (VARCHAR(42))
- payout (DECIMAL)
- feeAmount (DECIMAL)
- vrfRequestId (VARCHAR(66))
- chainCreatedAt, gameStartedAt, completedAt (TIMESTAMP)
- indexedAt, updatedAt
```

### Players Table
```sql
- id (UUID)
- roomId (UUID, FK)
- userAddress (VARCHAR(42), FK)
- characterId (INT)
- nickname (VARCHAR(100))
- position (INT) -- position in room
- isWinner (BOOLEAN)
- joinedAt (TIMESTAMP)
```

### Bets Table
```sql
- id (UUID)
- roomId (UUID, FK)
- userAddress (VARCHAR(42), FK)
- amount (DECIMAL)
- characterId (INT)
- transactionHash (VARCHAR(66), INDEXED)
- blockNumber (BIGINT)
- timestamp (TIMESTAMP)
```

### Transactions Table
```sql
- id (UUID)
- transactionHash (VARCHAR(66), UNIQUE, INDEXED)
- type (ENUM: BET, PAYOUT, FEE_COLLECTION)
- roomId (UUID, FK, NULLABLE)
- fromAddress (VARCHAR(42))
- toAddress (VARCHAR(42))
- amount (DECIMAL)
- blockNumber (BIGINT, INDEXED)
- timestamp (TIMESTAMP, INDEXED)
- status (VARCHAR)
```

### Indexer State Table
```sql
- id (INT)
- key (VARCHAR(50), UNIQUE) -- e.g., 'last_indexed_block'
- value (TEXT)
- metadata (TEXT) -- JSON
- createdAt, updatedAt
```

## REST API

### Base URL: `/api/v1`

#### Rooms

**GET** `/rooms`
- Query params: `status`, `limit`, `offset`
- Returns: Active rooms list with pagination
- Response:
```json
{
  "data": [
    {
      "roomId": "1",
      "roomSize": 5,
      "betAmount": "5000000000000000",
      "betAmountEth": "0.005",
      "status": "WAITING_FOR_PLAYERS",
      "currentPlayers": 3,
      "totalPot": "15000000000000000",
      "totalPotEth": "0.015",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0
  }
}
```

**GET** `/rooms/:roomId`
- Returns: Detailed room information with players

**GET** `/rooms/:roomId/players`
- Returns: List of players in the room

**GET** `/rooms/history/completed`
- Query params: `limit`, `offset`
- Returns: Completed games history

#### Users

**GET** `/users/:address`
- Returns: User profile and statistics

**GET** `/users/:address/stats`
- Returns: Detailed user statistics (win rate, ROI, etc.)

**GET** `/users/:address/history`
- Query params: `limit`, `offset`
- Returns: User's game history

#### Leaderboards

**GET** `/leaderboard/top-winners`
- Query params: `limit` (default: 100)
- Returns: Top players by wins

**GET** `/leaderboard/top-earners`
- Query params: `limit`
- Returns: Top players by earnings

**GET** `/leaderboard/highest-wagered`
- Query params: `limit`
- Returns: Top players by total wagered

**GET** `/leaderboard/recent-winners`
- Query params: `limit` (default: 20)
- Returns: Most recent game winners

#### Health

**GET** `/health`
- Returns: Server and blockchain connection status

## WebSocket Events

### Namespace: `/events`

#### Client → Server (Subscribe)

**`subscribe:room`**
```json
{ "roomId": "1" }
```

**`unsubscribe:room`**
```json
{ "roomId": "1" }
```

**`subscribe:lobby`**
```json
{}
```

**`unsubscribe:lobby`**
```json
{}
```

#### Server → Client (Broadcasts)

**`room:created`**
```json
{
  "roomId": "1",
  "roomSize": 5,
  "betAmount": "5000000000000000",
  "currentPlayers": 0,
  "status": "WAITING_FOR_PLAYERS",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**`room:player-joined`**
```json
{
  "roomId": "1",
  "player": {
    "address": "0x...",
    "characterId": 3,
    "nickname": "Player1",
    "position": 0,
    "joinedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**`game:started`**
```json
{
  "roomId": "1",
  "status": "IN_PROGRESS",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**`game:completed`**
```json
{
  "roomId": "1",
  "winner": "0x...",
  "payout": "22500000000000000",
  "status": "COMPLETED",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**`room:updated`**
```json
{
  "roomId": "1"
}
```

## Environment Variables

### Local Development (`.env`)
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=spinwheel
DB_PASSWORD=your_password
DB_DATABASE=spinwheel_db
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Blockchain - Sepolia Testnet
CHAIN_ID=11155111
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
RPC_WEBSOCKET_URL=wss://sepolia.infura.io/ws/v3/YOUR_KEY
FALLBACK_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x...
CONTRACT_DEPLOYMENT_BLOCK=5000000

# Indexer
INDEXER_ENABLED=true
INDEXER_BLOCK_BATCH_SIZE=1000
INDEXER_POLL_INTERVAL=12000
INDEXER_CONFIRM_BLOCKS=3

# API
API_RATE_LIMIT_TTL=60
API_RATE_LIMIT_LIMIT=100
API_CACHE_TTL=30

# CORS
CORS_ORIGIN=http://localhost:3000
WS_CORS_ORIGIN=http://localhost:3000
```

### Production
- Use environment secrets management (AWS Secrets Manager, Azure Key Vault)
- Enable PostgreSQL SSL
- Use managed PostgreSQL (RDS, Cloud SQL, Azure Database)
- Set `DB_SYNCHRONIZE=false` (always use migrations)
- Configure proper CORS origins
- Add Redis for distributed caching
- Enable API rate limiting per IP
- Set up logging (Sentry, DataDog, CloudWatch)

## Deployment

### Prerequisites
```bash
# Install dependencies
npm install

# Set up PostgreSQL database
createdb spinwheel_db

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Database Migrations
```bash
# Generate migration
npm run migration:generate -- src/database/migrations/InitialSchema

# Run migrations
npm run migration:run

# Revert migration (if needed)
npm run migration:revert
```

### Run Application
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main"]
```

## Monitoring

### Health Checks
- **Endpoint**: `GET /health`
- **Metrics**:
  - Server status
  - Database connection
  - Blockchain node connectivity
  - Current block number

### Logging
- All blockchain events logged with context
- Error tracking with stack traces
- Performance metrics for API endpoints

### Recommended Tools
- **APM**: New Relic, DataDog
- **Errors**: Sentry
- **Logs**: CloudWatch, Elasticsearch
- **Metrics**: Prometheus + Grafana

## Performance

### Caching Strategy
- Room list: 30s TTL
- User stats: 60s TTL
- Leaderboards: 5min TTL
- Completed games: 10min TTL

### Database Indexes
- All foreign keys indexed
- `walletAddress` on users
- `chainRoomId` on rooms
- `status` on rooms
- `transactionHash` on bets and transactions
- `blockNumber` on transactions

### WebSocket Optimization
- Automatic reconnection
- Room-based subscriptions
- Event batching for lobby updates

## Security

1. **Read-Only Operations**: Backend never sends transactions
2. **Input Validation**: All API inputs validated with class-validator
3. **Rate Limiting**: 100 req/min per IP
4. **CORS**: Whitelist specific origins
5. **SQL Injection**: TypeORM parameterized queries
6. **Data Integrity**: Blockchain events are source of truth
7. **Idempotency**: Events processed once (checked by transaction hash)

## Indexing

### Event Processing
1. **Historical Sync**: Batches of 1000 blocks
2. **Real-time Listening**: WebSocket subscriptions
3. **Confirmation Blocks**: Wait 3 blocks before finalizing
4. **Reorg Handling**: Re-process on chain reorganization
5. **Retry Logic**: 3 attempts with exponential backoff

### Events Indexed
- `RoomCreated`
- `PlayerJoined`
- `GameStarted`
- `RandomnessRequested`
- `GameCompleted`
- `NicknameSet`

## Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Responses

### Success Response
```json
{
  "data": { ... },
  "pagination": { ... } // if applicable
}
```

### Error Response
```json
{
  "statusCode": 404,
  "message": "Room not found",
  "error": "Not Found"
}
```

## Troubleshooting

### Indexer Not Starting
- Check `INDEXER_ENABLED=true`
- Verify contract address is set
- Ensure RPC URL is accessible

### WebSocket Connection Failed
- Check `RPC_WEBSOCKET_URL` is configured
- Verify WebSocket CORS settings
- Check firewall rules

### Database Connection Error
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [TypeORM Documentation](https://typeorm.io/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

## License

MIT


