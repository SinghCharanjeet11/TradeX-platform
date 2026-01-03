-- Create paper_accounts table for paper trading feature
CREATE TABLE IF NOT EXISTS paper_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  initial_balance DECIMAL(20, 2) DEFAULT 100000.00 NOT NULL,
  current_balance DECIMAL(20, 2) DEFAULT 100000.00 NOT NULL,
  total_invested DECIMAL(20, 2) DEFAULT 0.00 NOT NULL,
  total_profit_loss DECIMAL(20, 2) DEFAULT 0.00 NOT NULL,
  total_trades INTEGER DEFAULT 0 NOT NULL,
  winning_trades INTEGER DEFAULT 0 NOT NULL,
  losing_trades INTEGER DEFAULT 0 NOT NULL,
  reset_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_at TIMESTAMP,
  leaderboard_visible BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_paper_accounts_user_id ON paper_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_accounts_leaderboard ON paper_accounts(current_balance DESC) 
  WHERE leaderboard_visible = true;

-- Add comment for documentation
COMMENT ON TABLE paper_accounts IS 'Stores paper trading account information for users to practice trading with virtual money';
COMMENT ON COLUMN paper_accounts.initial_balance IS 'Starting balance for paper trading account (default $100,000)';
COMMENT ON COLUMN paper_accounts.current_balance IS 'Current available cash balance in paper trading account';
COMMENT ON COLUMN paper_accounts.total_invested IS 'Total amount currently invested in holdings';
COMMENT ON COLUMN paper_accounts.total_profit_loss IS 'Total profit or loss across all trades';
COMMENT ON COLUMN paper_accounts.leaderboard_visible IS 'Whether user wants to appear on the leaderboard';
