# Factions.fun - Quick Reference

## 30-Second Pitch
Top 10 token holders get a private chat. Ranks update in real-time. Only eligible holders can send messages. Access auto-granted/revoked.

## What to Build (Priority Order)

### MVP (Must Have)
1. **Holder ranking system** - Fetch top 10 from Solana RPC
2. **Access control** - Check if wallet is in top 10
3. **Chat storage** - PostgreSQL for messages
4. **Real-time sync** - WebSocket for live updates
5. **Wallet auth** - Signature verification

### Phase 1 (Should Have)
- Automatic membership updates via webhooks
- Entry/exit notifications
- Leaderboard display

### Phase 2+ (Nice to Have)
- Read-only mode for non-members
- Message search & history
- User reputation
- Moderation tools

---

## Architecture Decision Tree

```
User connects wallet
    ↓
Submit token mint
    ↓
Backend checks: Is this wallet in top 10?
    ├─ YES → Show chat UI (send enabled)
    ├─ NO → Show read-only or locked state
    └─ MAYBE → Check pending webhooks

Message sent
    ↓
Backend verifies:
    • Valid signature?
    • Top 10 status still valid?
    • Rate limit OK?
    ├─ ALL GOOD → Store in DB → Broadcast via WS
    └─ FAILED → Return error
```

---

## Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React + Vite | Fast, modern, familiar |
| **Wallet** | Phantom (@solana/wallet-adapter) | Best UX |
| **Backend** | Node.js + Express | Fast, TypeScript support |
| **Database** | PostgreSQL | Reliable, good for queries |
| **Cache** | Redis | Fast leaderboard updates |
| **RPC** | Helius or Shyft | Better than base Solana RPC |
| **Real-time** | WebSocket | Live message delivery |
| **Hosting** | Vercel (FE), Railway/Render (BE) | Fast deploys, good uptime |

---

## File Structure (Suggested)

```
factionfun/
├── frontend/                   # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── TokenSelector.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   └── AccessGate.tsx
│   │   ├── hooks/
│   │   │   ├── useTopHolders.ts
│   │   │   ├── useChat.ts
│   │   │   └── useWallet.ts
│   │   ├── pages/
│   │   │   └── App.tsx
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # Node.js server
│   ├── src/
│   │   ├── services/
│   │   │   ├── holderService.ts
│   │   │   ├── chatService.ts
│   │   │   └── authService.ts
│   │   ├── routes/
│   │   │   ├── token.ts
│   │   │   ├── chat.ts
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── verify.ts
│   │   ├── db/
│   │   │   └── schema.sql
│   │   ├── jobs/
│   │   │   └── updateRankings.ts
│   │   ├── websocket/
│   │   │   └── handlers.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── PROJECT_PLAN.md             # This doc
```

---

## Critical Path (What Must Be Done First)

1. **Backend RPC integration** (blocks everything)
   - Can you fetch top 10 holders? Test this first.
   
2. **Top 10 calculation logic** (blocks chat, leaderboard)
   - Given holder data, correctly identify top 10
   
3. **Access control function** (blocks chat access)
   - Given wallet + token, return boolean (is top 10?)
   
4. **Signature verification** (blocks auth, security)
   - Can you verify signed messages from wallets?
   
5. **Chat table + endpoints** (enables MVP)
   - Store messages, retrieve history
   
6. **WebSocket** (enables real-time)
   - Broadcast messages to all users in a chat

7. **Frontend UI** (enables usage)
   - All the above must work before UI makes sense

---

## Testing Strategy

### Unit Tests
- Holder ranking logic (correct top 10 selection)
- Signature verification (security critical)
- Access control (should pass/fail correctly)

### Integration Tests
- Full message flow (sign → send → receive)
- Ranking updates (holder changes → access changes)
- WebSocket subscriptions

### Manual Testing
- Swap balances between test wallets
- Verify membership changes trigger
- Test UI at different leaderboard positions

---

## Launch Checklist

- [ ] Backend deployed + healthy
- [ ] Database migrations completed
- [ ] Frontend deployed + accessible
- [ ] Wallet connection working
- [ ] Real-time messaging tested
- [ ] Security audit (signatures, access control)
- [ ] Load testing (100+ concurrent users)
- [ ] Error handling in place
- [ ] Logging set up
- [ ] Documentation complete

---

## Key Metrics to Track

- Active chat rooms (by token)
- Messages sent per day
- New members entering/leaving top 10
- Avg message latency (should be < 500ms)
- System uptime
- Error rates

