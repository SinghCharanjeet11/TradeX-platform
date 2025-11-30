-- Create ip_blocks table for temporary IP blocking
CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_by VARCHAR(50),
  
  CONSTRAINT ip_blocks_unique_ip UNIQUE(ip_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip_address ON ip_blocks(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_expires_at ON ip_blocks(expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_active ON ip_blocks(ip_address, expires_at);

-- Add comments for documentation
COMMENT ON TABLE ip_blocks IS 'Stores temporarily blocked IP addresses for security enforcement';
COMMENT ON COLUMN ip_blocks.ip_address IS 'The blocked IP address';
COMMENT ON COLUMN ip_blocks.reason IS 'Reason for blocking (e.g., repeated rate limit violations, brute force)';
COMMENT ON COLUMN ip_blocks.blocked_at IS 'Timestamp when the IP was blocked';
COMMENT ON COLUMN ip_blocks.expires_at IS 'Timestamp when the block expires (automatic unblock)';
COMMENT ON COLUMN ip_blocks.created_by IS 'System component or admin that created the block';
