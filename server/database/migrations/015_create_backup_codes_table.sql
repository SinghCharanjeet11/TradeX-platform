-- Create backup_codes table for 2FA recovery
CREATE TABLE IF NOT EXISTS backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT backup_codes_unique_code UNIQUE(code_hash)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_code_hash ON backup_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_backup_codes_used ON backup_codes(used);

-- Add comments for documentation
COMMENT ON TABLE backup_codes IS 'Stores hashed backup recovery codes for 2FA account recovery';
COMMENT ON COLUMN backup_codes.code_hash IS 'SHA-256 hash of the backup code for secure storage';
COMMENT ON COLUMN backup_codes.used IS 'Whether this backup code has been used (single-use enforcement)';
COMMENT ON COLUMN backup_codes.used_at IS 'Timestamp when the backup code was used';
