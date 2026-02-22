import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const TEST_MINT = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'; // example
const TEST_WALLETS = [
  'DRpbCBMxVnDK7maPGv7USk2LpS3GtFdYTbrgBif3GSLM',
  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
  'HN7cABqLq46Es1jh92dQQisAi5YqfC7KsFN4khQLUhV6',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'AobVSwdW9BbpMdJvTqeCN4hPAmh4rHm7vwLnQ5AMTH4V',
  '3YmRq5CxhdggafJZEUFNHBLGzsVqXFmbhDDCiZZa63TS',
  'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
  'BPFLoaderUpgradeab1e11111111111111111111111',
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Seed users
    for (const wallet of TEST_WALLETS) {
      await pool.query(
        `INSERT INTO users (wallet_address) VALUES ($1)
         ON CONFLICT (wallet_address) DO NOTHING`,
        [wallet]
      );
    }
    console.log(`Seeded ${TEST_WALLETS.length} users`);

    // Seed rankings
    for (let i = 0; i < TEST_WALLETS.length; i++) {
      const balance = BigInt(1000000000 - i * 100000000);
      const percentage = (100 - i * 10).toFixed(2);
      await pool.query(
        `INSERT INTO rankings (token_mint, rank, wallet_address, balance, percentage)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (token_mint, rank)
         DO UPDATE SET wallet_address = $3, balance = $4, percentage = $5, updated_at = NOW()`,
        [TEST_MINT, i + 1, TEST_WALLETS[i], balance.toString(), percentage]
      );
    }
    console.log(`Seeded rankings for ${TEST_MINT}`);

    // Seed messages
    const messages = [
      { wallet: TEST_WALLETS[0], content: 'gm holders' },
      { wallet: TEST_WALLETS[1], content: 'who is buying more?' },
      { wallet: TEST_WALLETS[2], content: 'holding strong' },
      { wallet: TEST_WALLETS[0], content: 'lets coordinate' },
      { wallet: TEST_WALLETS[3], content: 'top 10 gang' },
    ];

    for (const msg of messages) {
      await pool.query(
        `INSERT INTO messages (token_mint, wallet_address, content, signature)
         VALUES ($1, $2, $3, $4)`,
        [TEST_MINT, msg.wallet, msg.content, 'seed-signature']
      );
    }
    console.log(`Seeded ${messages.length} messages`);

    console.log('Seed complete');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
