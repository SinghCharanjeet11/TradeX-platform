-- Migration: Enhance holdings table with new columns and indexes
-- Purpose: Add account and notes columns, create indexes for pagination
-- Date: 2025-11-26

-- Add new columns to holdings table
ALTER TABLE holdings 
ADD COLUMN IF NOT EXISTS account VARCHAR(100) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for pagination queries (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_holdings_user_created 
ON holdings(user_id, created_at DESC);

-- Create index for user + symbol + asset_type (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_holdings_user_symbol_type 
ON holdings(user_id, symbol, asset_type);

-- Create index for asset type filtering
CREATE INDEX IF NOT EXISTS idx_holdings_asset_type 
ON holdings(user_id, asset_type);

-- Add comments to new columns
COMMENT ON COLUMN holdings.account IS 'Account name where the holding is stored (e.g., "Binance", "Coinbase")';
COMMENT ON COLUMN holdings.notes IS 'Optional user notes about the holding';
