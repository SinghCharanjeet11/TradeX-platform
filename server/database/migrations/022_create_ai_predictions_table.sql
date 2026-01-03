-- Create AI predictions table
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'forex', 'commodity')),
  time_horizon VARCHAR(10) NOT NULL CHECK (time_horizon IN ('24h', '7d', '30d')),
  predicted_price DECIMAL(20, 8) NOT NULL,
  price_range_min DECIMAL(20, 8) NOT NULL,
  price_range_max DECIMAL(20, 8) NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT price_range_valid CHECK (price_range_min < price_range_max),
  CONSTRAINT predicted_price_in_range CHECK (predicted_price >= price_range_min AND predicted_price <= price_range_max)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_symbol ON ai_predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_asset_type ON ai_predictions(asset_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_time_horizon ON ai_predictions(time_horizon);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_generated_at ON ai_predictions(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_expires_at ON ai_predictions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_symbol_horizon ON ai_predictions(symbol, time_horizon);

-- Add comment
COMMENT ON TABLE ai_predictions IS 'Stores AI-generated price predictions for assets';
