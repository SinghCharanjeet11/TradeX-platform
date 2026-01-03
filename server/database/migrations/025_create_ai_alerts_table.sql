-- Create AI alerts table
CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('anomaly', 'signal', 'risk')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recommended_action TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add channels column to ai_alerts table
ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '["in-app"]'::jsonb;

-- Create alert configuration table
CREATE TABLE IF NOT EXISTS alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sensitivity VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (sensitivity IN ('low', 'medium', 'high')),
  channels JSONB DEFAULT '["in-app"]'::jsonb,
  asset_filters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user_id ON ai_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_symbol ON ai_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_alert_type ON ai_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity ON ai_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_read ON ai_alerts(read);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_created_at ON ai_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user_created ON ai_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_config_user_id ON alert_config(user_id);

-- Create trigger to automatically update updated_at for alert config
DROP TRIGGER IF EXISTS update_alert_config_updated_at ON alert_config;
CREATE TRIGGER update_alert_config_updated_at BEFORE UPDATE ON alert_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE ai_alerts IS 'Stores AI-generated alerts for users';
COMMENT ON TABLE alert_config IS 'Stores user alert configuration preferences';
