# Blockchain Transaction API

A multi-chain blockchain transaction API with built-in security intelligence, risk scoring, and real-time monitoring capabilities. This API provides unified access to Bitcoin, Ethereum, and other blockchain networks with advanced analytics features for developers and businesses.

## Overview

This project addresses the challenge of accessing and analyzing blockchain transaction data across multiple chains while providing security intelligence that goes beyond raw transaction data. It combines transaction querying with risk assessment, address reputation tracking, and compliance screening.

## Core Features

### Multi-Chain Support
- Bitcoin (Mainnet and Testnet)
- Ethereum (Mainnet and Sepolia)
- Extensible architecture for additional chains (Polygon, BSC, etc.)

### Transaction Intelligence
- Real-time transaction fetching and parsing
- Transaction simulation before broadcasting
- MEV detection
- Gas optimization insights
- Human-readable transaction decoding

### Security Features
- Transaction risk scoring algorithm
- Address reputation system
- AML screening
- Sanctions list checking 
- Smart contract interaction analysis
- Suspicious pattern detection

### Performance
- Redis-based caching layer
- Efficient database indexing with TimescaleDB
- Rate limiting and API key management
- WebSocket support for real-time updates

## Technology Stack

### Backend
- **Next.js 14**
- **TypeScript**
- **Prisma** 
- **PostgreSQL (TimescaleDB)** 
- **Redis**

### Blockchain Integration
- **Bitcoin Core** - Bitcoin node connection
- **Geth/Erigon** - Ethereum node options
- **ethers.js** - Ethereum interaction library
- **bitcoinjs-lib** - Bitcoin transaction parsing

### Infrastructure
- **Docker & Docker Compose** - Containerized deployment
- **Node.js 20** - Runtime environment

## Architecture

```
┌─────────────────────────────────────┐
│         API Layer (Next.js)         │
│  - REST endpoints                   │
│  - WebSocket connections            │
│  - Rate limiting                    │
│  - Authentication                   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Processing Layer (Services)    │
│  - Transaction parser               │
│  - Risk scoring engine              │
│  - Address reputation tracker       │
│  - Cross-chain analyzer             │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Data Layer (Storage)          │
│  - PostgreSQL (structured data)     │
│  - Redis (cache + real-time)        │
│  - TimescaleDB (time-series)        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│    Blockchain Layer (Nodes)         │
│  - Bitcoin Core                     │
│  - Ethereum Client                  │
│  - Chain indexers                   │
└─────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

1. Clone the repository
```bash
git clone https://github.com/Roysamson-stack/blocks-apis.git
cd apps
```

2. Start infrastructure services
```bash
docker-compose up -d postgres redis
```

3. Install dependencies
```bash
cd apps/api
npm install
```

4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Setup database
```bash
npx prisma generate
npx prisma db push
```

6. Start development server
```bash
npm run dev
```

## API Documentation

### Health Check
```
GET /api/health
```
Returns system health status including database, cache, and blockchain node connectivity.

### Bitcoin Endpoints

#### Get Transaction
```
GET /api/v1/bitcoin/transaction/:txHash
```
Returns detailed transaction information including inputs, outputs, and risk score.

#### Get Address Info
```
GET /api/v1/bitcoin/address/:address
```
Returns address details, transaction history, and reputation score.

### Ethereum Endpoints

#### Get Transaction
```
GET /api/v1/ethereum/transaction/:txHash
```
Returns transaction details, receipt, and decoded smart contract interactions.

#### Simulate Transaction
```
POST /api/v1/ethereum/simulate
```
Simulates a transaction before broadcasting to detect potential failures.

### Cross-Chain Endpoints

#### Trace Address Across Chains
```
GET /api/v1/cross-chain/trace/:address
```
Tracks address activity across multiple blockchain networks.

### Response Format
All endpoints return JSON in the following format:
```json
{
  "success": true,
  "data": { ... },
  "cached": false,
  "timestamp": "2025-10-20T12:00:00Z"
}
```

## Configuration

### Environment Variables

**Database**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

**Blockchain Nodes**
- `BITCOIN_RPC_URL` - Bitcoin node RPC endpoint
- `BITCOIN_RPC_USER` - RPC username
- `BITCOIN_RPC_PASSWORD` - RPC password
- `ETHEREUM_RPC_URL` - Ethereum JSON-RPC endpoint
- `ETHEREUM_WS_URL` - Ethereum WebSocket endpoint

**API Configuration**
- `API_RATE_LIMIT_MAX` - Maximum requests per window
- `API_RATE_LIMIT_WINDOW` - Rate limit window in milliseconds
- `JWT_SECRET` - Secret for JWT token generation
- `API_KEY_SALT` - Salt for API key hashing

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# View database in GUI
npx prisma studio

# Create migration
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v
```

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

- All API endpoints support rate limiting
- API key authentication required for production
- CORS configured for specific origins
- Input validation on all endpoints
- SQL injection protection via Prisma
- Environment variables for sensitive data

## Performance Optimization

- Redis caching with configurable TTL
- Database query optimization with indexes
- Connection pooling for blockchain nodes
- Lazy loading for large datasets
- Pagination support on list endpoints

## Monitoring

The `/api/health` endpoint provides real-time monitoring of:
- Database connectivity
- Redis availability
- Bitcoin node status
- Ethereum node status
- API response times

## Roadmap

### Phase 1 (Current)
- Multi-chain transaction fetching
- Basic risk scoring
- Caching layer
- Health monitoring

### Phase 2
- Advanced risk algorithms
- Machine learning-based fraud detection
- Additional blockchain support
- Enhanced API documentation

### Phase 3
- GraphQL API
- Advanced analytics dashboard
- Historical data analysis
- Custom alerting system

### Phase 4
- Enterprise features
- SLA guarantees
- Dedicated node infrastructure
- Custom compliance reporting

## Contributing

Contributions are welcome. Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - See LICENSE file for details

<!-- ## Support

For issues and questions:
- GitHub Issues: [link]
- Documentation: [link]
- Email: support@example.com -->

## Author

Samson Roy
<!-- - Portfolio: [your-portfolio-url]
- LinkedIn: [your-linkedin] -->
