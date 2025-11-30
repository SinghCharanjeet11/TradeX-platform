-- Create user_2fa table for Two-Factor Authentication
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP,
  backup_codes_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT user_2fa_unique_user UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(enabled);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON user_2fa;
CREATE TRIGGER update_user_2fa_updated_at BEFORE UPDATE ON user_2fa
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_2fa IS 'Stores Two-Factor Authentication configuration for users';
COMMENT ON COLUMN user_2fa.secret_key IS 'Encrypted TOTP secret key for generating time-based codes';
COMMENT ON COLUMN user_2fa.enabled IS 'Whether 2FA is currently active for this user';
COMMENT ON COLUMN user_2fa.enabled_at IS 'Timestamp when 2FA was last enabled';
COMMENT ON COLUMN user_2fa.backup_codes_generated_at IS 'Timestamp when backup codes were last generated';
