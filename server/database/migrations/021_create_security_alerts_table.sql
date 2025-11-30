-- Create security_alerts table for user security notifications
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT security_alerts_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);

-- Create index for unacknowledged alerts per user
CREATE INDEX IF NOT EXISTS idx_security_alerts_unack_user ON security_alerts(user_id, created_at DESC) WHERE acknowledged = FALSE;

-- Add comments for documentation
COMMENT ON TABLE security_alerts IS 'Security alerts and notifications for users';
COMMENT ON COLUMN security_alerts.alert_type IS 'Type of alert (new_device, unusual_location, failed_login, etc.)';
COMMENT ON COLUMN security_alerts.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN security_alerts.message IS 'Human-readable alert message';
COMMENT ON COLUMN security_alerts.metadata IS 'Additional alert details as JSON (IP, location, device, etc.)';
COMMENT ON COLUMN security_alerts.acknowledged IS 'Whether the user has acknowledged this alert';
COMMENT ON COLUMN security_alerts.acknowledged_at IS 'Timestamp when the alert was acknowledged';
