# Factions.fun - Development Plan

## Project Overview

**Name:** Factions.fun  
**Ticker:** $FTN  
**Twitter:** https://x.com/factionsdotfun?s=21

An on-chain group chat platform where only the top 10 holders of a Pump.fun token can access and participate in a private chat dedicated to that token.

---

## Core Value Proposition

- **Problem:** Top token holders can't easily communicate or coordinate with each other
- **Solution:** Private, gated chat rooms automatically managed by on-chain holder data
- **New Incentive:** Become a top 10 holder to gain access and influence in token communities

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  • Token selector  • Leaderboard  • Chat UI  • Wallet auth   │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
        ┌───────────▼────────┐   ┌───▼─────────────┐
        │   Backend (Node)   │   │  Smart Contract │
        │  • Rankings logic  │   │  • Verification │
        │  • Auth/Access     │   │  • Hooks (opt)  │
        │  • Chat storage    │   └─────────────────┘
        └────────┬───────────┘
                 │
        ┌────────▼─────────────┐
        │  Solana RPC / APIs   │
        │  • Token holders     │
        │  • Balances          │
        │  • Real-time updates │
        └──────────────────────┘

Database:
• PostgreSQL (messages, user records)
• Redis (cache, hot data, leaderboards)
• Webhook listeners for balance changes
```

---

## Phase Breakdown

### **Phase 0: MVP (Week 1-2)**

Goal: Minimal working product to validate the concept

#### Components:

**1. Backend - Holder Ranking Service**
- [ ] Setup Node.js + Express server
- [ ] Integrate Solana RPC / Helius API for token holder data
- [ ] Implement top 10 holder calculation logic
- [ ] Store rankings in Redis cache
- [ ] Expose `/api/token/:mint/top-holders` endpoint
- [ ] Scheduled job to refresh rankings (every 30-60 seconds)

**2. Frontend - Basic UI**
- [ ] React app with wallet connection (Phantom adapter)
- [ ] Token mint input form
- [ ] Display top 10 holders leaderboard
- [ ] Mock chat interface (read-only for now)
- [ ] Wallet signature verification for future auth

**3. Access Control Logic**
- [ ] Function: `isUserInTop10(walletAddress, tokenMint)`
- [ ] Check user's balance vs. top 10 threshold
- [ ] Return boolean + rank info
- [ ] Cache results for 30 seconds

**4. Simple Chat (Hybrid Model)**
- [ ] PostgreSQL table: `messages(id, tokenMint, walletAddress, content, timestamp, signature)`
- [ ] Endpoint: `POST /api/chat/message` (requires signature + top 10 check)
- [ ] Endpoint: `GET /api/chat/:mint` (paginated message history)
- [ ] WebSocket: `ws://backend/chat/:mint` (real-time messages)

**5. Deployment**
- [ ] Backend: Render / Railway / DigitalOcean
- [ ] Frontend: Vercel
- [ ] Database: Supabase PostgreSQL

---

### **Phase 1: Dynamic Membership (Week 3)**

Goal: Auto-update access when holder rankings change

#### Components:

- [ ] Webhook listener for token balance changes (Helius / Magic Eden webhooks)
- [ ] Queue system for processing ranking updates (Bull/RabbitMQ)
- [ ] Notif system: "You entered top 10!" / "You've dropped out"
- [ ] Grace period logic (optional): 5-min window after drop-out to regain access
- [ ] Real-time leaderboard updates via WebSocket
- [ ] Track join/leave events in audit log

---

### **Phase 2: Enhanced Features (Week 4)**

Goal: Improve UX and add optional features

#### Components:

- [ ] Read-only mode for non-top 10 holders (see messages, can't send)
- [ ] Message history & search
- [ ] User profiles / reputation system (message count, joined date)
- [ ] Pin important messages
- [ ] Token info panel (price, holder count, holder concentration)
- [ ] Moderation tools (admins can remove messages)
- [ ] Rate limiting per user

---

### **Phase 3: Smart Contract & On-Chain (Future)**

Goal: Fully on-chain verification and messaging (if needed)

#### Components:

- [ ] Anchor program on Solana
- [ ] On-chain message PDA storage
- [ ] Token-gated instruction validation
- [ ] On-chain holder snapshot / proof
- [ ] Integration with backend for verification

---

## Technical Specifications

### Backend Stack

- **Language:** Node.js (TypeScript recommended)
- **Framework:** Express or Fastify
- **Database:** PostgreSQL (Supabase) + Redis
- **APIs:**
  - Helius / Shyft for token holder data
  - Solana Web3.js for verification
  - Phantom / Solflare for wallet integration
- **Real-time:** WebSocket (ws library or Socket.io)
- **Jobs:** Bull queue for background tasks
- **Auth:** Wallet signature verification (bs58 + ed25519)

### Frontend Stack

- **Framework:** React 18+
- **Wallet:** @solana/wallet-adapter-react
- **UI:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query + Zustand
- **Real-time:** Socket.io-client
- **Build:** Vite

### Database Schema

```sql
-- Users (optional, for tracking)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP
);

-- Messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44) NOT NULL,
  wallet_address VARCHAR(44) NOT NULL,
  content TEXT NOT NULL,
  signature VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (token_mint, created_at),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

-- Rankings (snapshot)
CREATE TABLE rankings (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44) NOT NULL,
  rank INT (1-10),
  wallet_address VARCHAR(44),
  balance BIGINT,
  percentage DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (token_mint, rank)
);

-- Events (for tracking membership changes)
CREATE TABLE membership_events (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44),
  wallet_address VARCHAR(44),
  event_type ENUM('enter_top10', 'leave_top10'),
  rank_before INT,
  rank_after INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints (Phase 0)

### Public Endpoints

```
GET /api/token/:mint/top-holders
  Response: [{ rank, walletAddress, balance, percentage }, ...]

GET /api/token/:mint/user/:wallet
  Response: { isInTop10, rank, balance, percentage }

GET /api/chat/:mint/messages?limit=50&offset=0
  Response: [{ id, walletAddress, content, timestamp }, ...]

GET /api/token/:mint/info
  Response: { mint, name, decimals, totalSupply, holders }
```

### Protected Endpoints (require signature)

```
POST /api/chat/message
  Body: { tokenMint, content, signature, publicKey }
  Auth: Verify signature before storing
  Response: { messageId, status }

POST /api/auth/verify
  Body: { walletAddress, signature, message }
  Response: { token, expiresIn }
```

### WebSocket

```
ws://backend/chat/:mint
  Events:
  - "message" → broadcast new message
  - "rankings" → broadcast ranking update
  - "user_joined" → X entered top 10
  - "user_left" → X dropped out
```

---

## Security Considerations

1. **Signature Verification**
   - Every message must be signed by the wallet sending it
   - Verify signature using Solana's ed25519 verify
   - Include message content + timestamp in signature to prevent replay

2. **Rate Limiting**
   - Max 1 message per 2 seconds per wallet
   - Max 100 messages per hour
   - Enforce via Redis counter

3. **Access Control**
   - Always verify top 10 status before allowing message send
   - Check signature expiration (TTL)
   - Use CORS for frontend domains

4. **Data Validation**
   - Sanitize message content (no script tags, size limits)
   - Validate token mint format
   - Validate wallet addresses (44 chars base58)

5. **Privacy**
   - Don't expose non-top 10 holders to leaderboard
   - Store IP logs for moderation
   - Allow users to opt-out of notifications

---

## Implementation Roadmap

### Week 1: MVP Setup
- [ ] Project structure (frontend + backend repos)
- [ ] Backend: Express, PostgreSQL, Redis setup
- [ ] Solana RPC integration
- [ ] Top holders calculation
- [ ] Frontend: React, wallet adapter, basic UI

### Week 2: MVP Completion
- [ ] Chat endpoints implementation
- [ ] WebSocket real-time messaging
- [ ] Signature verification
- [ ] Leaderboard display
- [ ] Deploy to staging

### Week 3: Dynamic Updates
- [ ] Webhook listeners
- [ ] Queue system
- [ ] Membership event tracking
- [ ] Notifications
- [ ] Real-time leaderboard sync

### Week 4: Polish & Features
- [ ] Read-only mode
- [ ] Message search
- [ ] User profiles
- [ ] Moderation tools
- [ ] Performance optimization
- [ ] Production deployment

---

## Key Considerations & Risks

| Risk | Mitigation |
|------|-----------|
| **RPC rate limits** | Use Helius/Shyft with higher quota, implement caching |
| **Holder data staleness** | Combine scheduled jobs + webhook listeners |
| **Message spam** | Rate limiting + moderation tools |
| **Wallet disconnection** | Auto-reconnect, session persistence |
| **Scalability (many tokens)** | Lazy load rankings, use sharded Redis |
| **False top 10 claims** | Always verify on-chain before granting access |

---

## Success Metrics

- [ ] MVP deployed and working
- [ ] Real-time message delivery < 500ms
- [ ] Top 10 ranking accuracy > 99.9%
- [ ] Wallet signature verification 100% success
- [ ] No unauthorized access to private chats
- [ ] Uptime > 99%

---

## Deployment Checklist

### Backend
- [ ] Environment variables (.env)
- [ ] Database migrations
- [ ] Redis connection pooling
- [ ] Error logging (Sentry)
- [ ] Health check endpoint
- [ ] Rate limiting headers

### Frontend
- [ ] Build optimization
- [ ] Environment config
- [ ] Error boundaries
- [ ] Analytics (optional)
- [ ] SEO meta tags

### Post-Launch
- [ ] Monitor API performance
- [ ] Track user growth
- [ ] Gather feedback
- [ ] Plan Phase 2 features

---

## Team & Roles (If applicable)

- **Backend Lead:** RPC integration, ranking logic, auth
- **Frontend Lead:** UI/UX, wallet integration, real-time sync
- **DevOps:** Deployment, monitoring, scaling
- **Product:** Feature prioritization, user feedback

---

## Next Steps

1. ✅ Approve this plan
2. [ ] Set up GitHub repos (frontend + backend)
3. [ ] Create development environment
4. [ ] Start Phase 0 sprint
5. [ ] Daily standups + weekly demos

