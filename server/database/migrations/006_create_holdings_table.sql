-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('crypto', 'stocks', 'forex', 'commodities')),
  quantity DECIMAL(20, 8) NOT NULL,
  average_buy_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  account VARCHAR(50) DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_holdings_account ON holdings(account);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_user_symbol_type ON holdings(user_id, symbol, asset_type);
