-- Create oauth_accounts table for storing OAuth provider information
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'twitter', etc.
  provider_user_id VARCHAR(255) NOT NULL, -- User ID from the OAuth provider
  access_token TEXT, -- OAuth access token
  refresh_token TEXT, -- OAuth refresh token
  profile_data JSONB, -- Store additional profile data from provider
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);

-- Add comment
COMMENT ON TABLE oauth_accounts IS 'Stores OAuth authentication information for users';

