# Factions.fun

On-chain group chat for the top 10 holders of any Pump.fun token on Solana.

**Ticker:** $FTN
**Twitter:** [@factionsdotfun](https://x.com/factionsdotfun)

## How It Works

1. Connect your Solana wallet
2. Enter a token mint address
3. If you're a top 10 holder, you get access to the private chat for that token
4. Rankings update in real-time — lose your spot, lose access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React 19, Tailwind v4 |
| Backend | Node.js, Express, TypeScript (ESM) |
| Database | PostgreSQL + Redis |
| Real-time | WebSocket (ws) |
| Auth | Wallet signature (Privy) + JWT |
| RPC | Helius API |
| Wallet | Privy (@privy-io/react-auth) |

## Project Structure

```
factionfun/
├── frontend/          # Next.js app (port 3000)
│   └── src/
│       ├── app/       # App router pages & layout
│       ├── components/ # UI components
│       ├── hooks/     # Custom React hooks
│       └── lib/       # API & WebSocket clients
├── backend/           # Express API (port 3001) + WebSocket (port 3002)
│   └── src/
│       ├── services/  # Business logic
│       ├── routes/    # API endpoints
│       ├── middleware/ # Auth, rate limiting
│       ├── websocket/ # Real-time handlers
│       ├── jobs/      # Background ranking updates
│       ├── db/        # Schema, migrations, seeds
│       └── utils/     # Config, DB, Redis, validation
├── package.json       # Root workspace config
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm
- PostgreSQL
- Redis

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database, Redis, and Helius API credentials

# Run database migrations
pnpm --filter factionfun-backend run db:migrate

# Seed the database (optional)
pnpm --filter factionfun-backend run db:seed
```

### Development

```bash
# Run both frontend and backend
pnpm dev

# Or run individually
pnpm dev:frontend   # http://localhost:3000
pnpm dev:backend    # http://localhost:3001
```

### Build

```bash
pnpm build:frontend
pnpm build:backend
```

## API Endpoints

### Public

- `GET /api/token/:mint/top-holders` — Top 10 holders for a token
- `GET /api/token/:mint/user/:wallet` — Check if wallet is in top 10
- `GET /api/chat/:mint/messages` — Chat message history

### Protected (requires auth)

- `POST /api/chat/message` — Send a message
- `POST /api/auth/verify` — Verify wallet signature

### WebSocket

- `ws://localhost:3002` — Real-time chat messages and ranking updates

## License

MIT
