-- Enhance sessions table with device tracking and activity monitoring
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
  ADD COLUMN IF NOT EXISTS os VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_country VARCHAR(2),
  ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create additional indexes for enhanced querying
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_device_type ON sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_sessions_location_country ON sessions(location_country);

-- Add comments for documentation
COMMENT ON COLUMN sessions.device_fingerprint IS 'Unique identifier for the device accessing the session';
COMMENT ON COLUMN sessions.device_type IS 'Type of device (mobile, tablet, desktop)';
COMMENT ON COLUMN sessions.browser IS 'Browser name and version';
COMMENT ON COLUMN sessions.os IS 'Operating system name and version';
COMMENT ON COLUMN sessions.location_country IS 'ISO 3166-1 alpha-2 country code from IP geolocation';
COMMENT ON COLUMN sessions.location_city IS 'City name from IP geolocation';
COMMENT ON COLUMN sessions.last_activity IS 'Timestamp of last activity for session timeout tracking';
