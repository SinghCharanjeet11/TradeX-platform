-- Migration: Fix holdings unique constraint to include account
-- Purpose: Allow same symbol in different accounts (paper vs default)
-- Date: 2025-12-27

-- Drop the old unique index that doesn't include account
DROP INDEX IF EXISTS idx_holdings_user_symbol_type;

-- Create new unique index that includes account
CREATE UNIQUE INDEX idx_holdings_user_symbol_type_account 
ON holdings(user_id, symbol, asset_type, account);

-- Add comment
COMMENT ON INDEX idx_holdings_user_symbol_type_account IS 'Ensures unique holdings per user, symbol, asset type, and account';
