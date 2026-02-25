-- Factions.fun Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44) NOT NULL,
  wallet_address VARCHAR(44) NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  signature VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_messages_user
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_messages_token_created
  ON messages(token_mint, created_at DESC);

-- For global feed query (ORDER BY created_at DESC LIMIT N)
CREATE INDEX IF NOT EXISTS idx_messages_created
  ON messages(created_at DESC);

-- Index on FK column for efficient joins and cascading operations
CREATE INDEX IF NOT EXISTS idx_messages_wallet
  ON messages(wallet_address);

-- Rankings snapshot table
CREATE TABLE IF NOT EXISTS rankings (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44) NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  wallet_address VARCHAR(44) NOT NULL,
  balance NUMERIC NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (token_mint, rank)
);

CREATE INDEX IF NOT EXISTS idx_rankings_token
  ON rankings(token_mint);

CREATE INDEX IF NOT EXISTS idx_rankings_token_wallet
  ON rankings(token_mint, wallet_address);

-- Membership events table
CREATE TABLE IF NOT EXISTS membership_events (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44) NOT NULL,
  wallet_address VARCHAR(44) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('enter_top10', 'leave_top10')),
  rank_before INTEGER,
  rank_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_events_token
  ON membership_events(token_mint, created_at DESC);
