-- Create audit_logs table for comprehensive security auditing
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_id UUID,
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  action TEXT NOT NULL,
  resource_type VARCHAR(50),
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  result VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT audit_logs_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT audit_logs_result_check CHECK (result IN ('success', 'failure', 'error'))
);

-- Create indexes for performance and querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Create index for filtering by date range and user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);

-- Create index for critical events
CREATE INDEX IF NOT EXISTS idx_audit_logs_critical ON audit_logs(created_at DESC) WHERE severity IN ('high', 'critical');

-- Prevent updates and deletes to ensure immutability
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_audit_log_update ON audit_logs;
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_audit_log_delete ON audit_logs;
CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all security-relevant events and user actions';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL for system events)';
COMMENT ON COLUMN audit_logs.request_id IS 'Unique request identifier for correlating related events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (login, logout, 2fa_verify, password_change, etc.)';
COMMENT ON COLUMN audit_logs.event_category IS 'Category of event (authentication, account, trading, security, etc.)';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN audit_logs.action IS 'Human-readable description of the action';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (user, session, trade, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.old_value IS 'Previous value before change (for update operations)';
COMMENT ON COLUMN audit_logs.new_value IS 'New value after change (for update operations)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual information as JSON';
COMMENT ON COLUMN audit_logs.result IS 'Result of the action: success, failure, error';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if result is failure or error';
