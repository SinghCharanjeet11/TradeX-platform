-- Migration: Create price_history table
-- Purpose: Store historical price data for assets to enable price tracking and charts
-- Date: 2025-11-26

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create composite index for efficient querying by symbol, asset type, and time
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_time 
ON price_history(symbol, asset_type, timestamp DESC);

-- Create index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp 
ON price_history(timestamp DESC);

-- Create index for symbol lookups
CREATE INDEX IF NOT EXISTS idx_price_history_symbol 
ON price_history(symbol);

-- Add check constraint for valid asset types
ALTER TABLE price_history 
ADD CONSTRAINT chk_price_history_asset_type 
CHECK (asset_type IN ('crypto', 'stocks', 'forex', 'commodities'));

-- Add check constraint for positive prices
ALTER TABLE price_history 
ADD CONSTRAINT chk_price_history_positive_price 
CHECK (price > 0);

-- Add comment to table
COMMENT ON TABLE price_history IS 'Historical price data for all tracked assets';
COMMENT ON COLUMN price_history.symbol IS 'Asset symbol (e.g., BTC, AAPL, EUR/USD)';
COMMENT ON COLUMN price_history.asset_type IS 'Type of asset: crypto, stocks, forex, or commodities';
COMMENT ON COLUMN price_history.price IS 'Asset price at the given timestamp';
COMMENT ON COLUMN price_history.timestamp IS 'Time when the price was recorded';
