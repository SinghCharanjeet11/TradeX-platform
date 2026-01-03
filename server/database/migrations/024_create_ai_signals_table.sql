-- Create AI trading signals table
CREATE TABLE IF NOT EXISTS ai_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT NOT NULL,
  entry_price DECIMAL(20, 8),
  target_price DECIMAL(20, 8),
  stop_loss DECIMAL(20, 8),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT price_targets_valid CHECK (
    (signal_type = 'BUY' AND target_price > entry_price AND stop_loss < entry_price) OR
    (signal_type = 'SELL' AND target_price < entry_price AND stop_loss > entry_price) OR
    (signal_type = 'HOLD')
  )
);

-- Create signal dismissals table to track dismissed signals per user
CREATE TABLE IF NOT EXISTS ai_signal_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES ai_signals(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, signal_id)
);

-- Create signal indicators table for technical indicators
CREATE TABLE IF NOT EXISTS ai_signal_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES ai_signals(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  value DECIMAL(20, 8) NOT NULL,
  interpretation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_signals_symbol ON ai_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_signals_signal_type ON ai_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_ai_signals_generated_at ON ai_signals(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_signals_expires_at ON ai_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_signals_symbol_generated ON ai_signals(symbol, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_signal_dismissals_user_id ON ai_signal_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_signal_dismissals_signal_id ON ai_signal_dismissals(signal_id);
CREATE INDEX IF NOT EXISTS idx_ai_signal_indicators_signal_id ON ai_signal_indicators(signal_id);

-- Add comments
COMMENT ON TABLE ai_signals IS 'Stores AI-generated trading signals';
COMMENT ON TABLE ai_signal_dismissals IS 'Tracks which signals users have dismissed';
COMMENT ON TABLE ai_signal_indicators IS 'Stores technical indicators associated with signals';
