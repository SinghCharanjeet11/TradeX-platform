-- Create paper_account_resets table for tracking reset history
CREATE TABLE IF NOT EXISTS paper_account_resets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_before_reset DECIMAL(20, 2) NOT NULL,
  total_trades_before_reset INTEGER DEFAULT 0 NOT NULL,
  profit_loss_before_reset DECIMAL(20, 2) DEFAULT 0.00 NOT NULL,
  reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_paper_resets_user_id ON paper_account_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_resets_date ON paper_account_resets(reset_at DESC);

-- Add comment for documentation
COMMENT ON TABLE paper_account_resets IS 'Audit log of paper trading account resets';
COMMENT ON COLUMN paper_account_resets.balance_before_reset IS 'Account balance before the reset';
COMMENT ON COLUMN paper_account_resets.total_trades_before_reset IS 'Number of trades before the reset';
COMMENT ON COLUMN paper_account_resets.profit_loss_before_reset IS 'Total P/L before the reset';
