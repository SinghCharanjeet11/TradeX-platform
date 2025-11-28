-- Create connected_accounts table for storing encrypted exchange API credentials
CREATE TABLE IF NOT EXISTS connected_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(255),
  credentials TEXT NOT NULL, -- Encrypted credentials stored as text (iv:encrypted:tag format)
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_platform 
ON connected_accounts(user_id, platform) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE connected_accounts IS 'Stores encrypted API credentials for connected exchange accounts';
COMMENT ON COLUMN connected_accounts.credentials IS 'Encrypted credentials in format: iv:encrypted:tag';
