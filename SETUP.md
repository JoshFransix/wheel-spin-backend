# Spin The Wheel Backend - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd wheel-spin-backend
npm install
```

### 2. Set Up PostgreSQL

#### Option A: Docker (Recommended)
```bash
docker-compose up -d postgres
```

#### Option B: Local Installation
```bash
# Install PostgreSQL (if not installed)
# Create database
createdb spinwheel_db
```

### 3. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set:
# - RPC_URL (get from Infura/Alchemy)
# - RPC_WEBSOCKET_URL
# - CONTRACT_ADDRESS (your deployed contract)
# - CONTRACT_DEPLOYMENT_BLOCK
# - DB_PASSWORD
```

### 4. Run Database Migrations
```bash
npm run migration:run
```

### 5. Start the Server
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Verify Setup
```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "blockchain": {
    "connected": true,
    "currentBlock": 5000000,
    "contract": "0x..."
  }
}
```

## Docker Deployment

### Full Stack (Postgres + Redis + Backend)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Testing

### Test Room Endpoint
```bash
curl http://localhost:3000/api/v1/rooms
```

### Test WebSocket Connection
```javascript
// In browser console or Node.js
const io = require('socket.io-client');
const socket = io('http://localhost:3000/events');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to lobby
  socket.emit('subscribe:lobby');
});

socket.on('room:created', (data) => {
  console.log('New room created:', data);
});
```

## Troubleshooting

### "Cannot connect to database"
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database exists: `psql -l`

### "Cannot connect to blockchain"
- Verify RPC_URL is correct
- Check your Infura/Alchemy API key
- Test RPC: `curl -X POST YOUR_RPC_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

### "Contract address not found"
- Ensure CONTRACT_ADDRESS is set in `.env`
- Verify contract is deployed on the network
- Check CHAIN_ID matches your network

### Indexer not syncing
- Check logs for errors
- Verify CONTRACT_DEPLOYMENT_BLOCK is correct
- Ensure WebSocket URL is configured

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (RDS, Cloud SQL)
- [ ] Set up Redis for caching
- [ ] Configure CORS with specific origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable logging (Sentry, DataDog)
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for database
- [ ] Use environment secrets manager
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting per IP
- [ ] Set up load balancer for horizontal scaling

## Architecture Summary

```
┌──────────────┐
│   Frontend   │
│  (React)     │
└──────┬───────┘
       │
       │ HTTP/WebSocket
       │
┌──────▼───────────────────────────────┐
│        NestJS Backend                │
│                                      │
│  ┌────────────┐    ┌──────────────┐│
│  │ REST API   │    │  WebSocket   ││
│  │ Controllers│    │   Gateway    ││
│  └─────┬──────┘    └──────┬───────┘│
│        │                  │        │
│  ┌─────▼──────────────────▼──────┐ │
│  │       Services Layer          │ │
│  │  - Room Service               │ │
│  │  - User Service               │ │
│  │  - Leaderboard Service        │ │
│  └────────┬──────────────────────┘ │
│           │                         │
│  ┌────────▼──────────────────────┐ │
│  │   Blockchain Module           │ │
│  │  - Contract Service (Read)    │ │
│  │  - Indexer Service (Events)   │ │
│  └────────┬──────────────────────┘ │
└───────────┼──────────────────────────┘
            │
     ┌──────▼──────┐
     │ PostgreSQL  │
     │  Database   │
     └─────────────┘

            │
     ┌──────▼─────────┐
     │  Ethereum Node │
     │  (via Infura)  │
     │                │
     │ Smart Contract │
     │  (Sepolia)     │
     └────────────────┘
```

## Key Features Implemented

✅ **Event-Driven Indexing**
- Historical block scanning
- Real-time event listening
- Automatic reconnection
- Reorg handling

✅ **Comprehensive API**
- Room management
- User statistics
- Game history
- Leaderboards

✅ **Real-Time Updates**
- WebSocket subscriptions
- Room-based events
- Lobby broadcasts

✅ **Production Ready**
- TypeORM migrations
- Error handling
- Logging
- Health checks
- Rate limiting
- Caching

✅ **Database Design**
- Normalized schema
- Proper indexes
- Foreign key constraints
- Audit trails

## Next Steps

1. **Update Contract ABI**: Replace `src/common/constants/contract-abi.ts` with your deployed contract's ABI
2. **Configure Environment**: Set all required environment variables
3. **Run Migrations**: Initialize database schema
4. **Start Indexer**: Begin syncing historical data
5. **Test APIs**: Verify all endpoints are working
6. **Monitor Logs**: Watch for any errors or warnings

## Support

For issues or questions, check:
- Logs: Check terminal output and log files
- Health endpoint: `GET /health`
- Database: `npm run typeorm migration:show`
- Contract: Verify on Etherscan

---

**Happy coding! 🎡**
