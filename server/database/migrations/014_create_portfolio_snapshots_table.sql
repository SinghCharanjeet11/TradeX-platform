-- Migration: Create portfolio_snapshots table
-- Purpose: Store daily snapshots of portfolio performance for historical tracking
-- Date: 2025-11-26

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_value DECIMAL(20, 8) NOT NULL,
  total_invested DECIMAL(20, 8) NOT NULL,
  profit_loss DECIMAL(20, 8) NOT NULL,
  profit_loss_percent DECIMAL(10, 4) NOT NULL,
  holdings_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, snapshot_date)
);

-- Create index for efficient querying by user and date
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_date 
ON portfolio_snapshots(user_id, snapshot_date DESC);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date 
ON portfolio_snapshots(snapshot_date DESC);

-- Add comment to table
COMMENT ON TABLE portfolio_snapshots IS 'Daily snapshots of user portfolio performance for historical tracking and charts';
COMMENT ON COLUMN portfolio_snapshots.snapshot_date IS 'Date of the snapshot (one per day per user)';
COMMENT ON COLUMN portfolio_snapshots.total_value IS 'Total portfolio value at snapshot time';
COMMENT ON COLUMN portfolio_snapshots.total_invested IS 'Total amount invested at snapshot time';
COMMENT ON COLUMN portfolio_snapshots.profit_loss IS 'Total profit or loss at snapshot time';
COMMENT ON COLUMN portfolio_snapshots.profit_loss_percent IS 'Profit/loss as percentage of invested amount';
COMMENT ON COLUMN portfolio_snapshots.holdings_count IS 'Number of holdings at snapshot time';
