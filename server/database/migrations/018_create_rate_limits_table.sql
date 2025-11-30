-- Create rate_limits table for API rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint_category VARCHAR(50) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT rate_limits_unique_window UNIQUE(identifier, endpoint_category, window_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_category ON rate_limits(endpoint_category);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(identifier, endpoint_category, window_end);

-- Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Tracks API request counts for rate limiting enforcement';
COMMENT ON COLUMN rate_limits.identifier IS 'User ID, IP address, or other identifier for rate limiting';
COMMENT ON COLUMN rate_limits.endpoint_category IS 'Category of endpoint (auth, trading, market_data, account, general)';
COMMENT ON COLUMN rate_limits.request_count IS 'Number of requests made in the current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start timestamp of the rate limit window';
COMMENT ON COLUMN rate_limits.window_end IS 'End timestamp of the rate limit window';
