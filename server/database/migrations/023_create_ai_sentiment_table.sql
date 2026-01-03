-- Create AI sentiment analysis table
CREATE TABLE IF NOT EXISTS ai_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  sentiment_score DECIMAL(3, 2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment VARCHAR(10) NOT NULL CHECK (sentiment IN ('bearish', 'neutral', 'bullish')),
  trend VARCHAR(10) NOT NULL CHECK (trend IN ('improving', 'stable', 'declining')),
  trend_change DECIMAL(3, 2),
  articles_analyzed INTEGER NOT NULL DEFAULT 0,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT sentiment_matches_score CHECK (
    (sentiment = 'bearish' AND sentiment_score < -0.2) OR
    (sentiment = 'neutral' AND sentiment_score >= -0.2 AND sentiment_score <= 0.2) OR
    (sentiment = 'bullish' AND sentiment_score > 0.2)
  )
);

-- Create sentiment articles table for top contributing articles
CREATE TABLE IF NOT EXISTS ai_sentiment_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentiment_id UUID NOT NULL REFERENCES ai_sentiment(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source VARCHAR(255),
  sentiment DECIMAL(3, 2) NOT NULL CHECK (sentiment >= -1 AND sentiment <= 1),
  published_at TIMESTAMP,
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_sentiment_symbol ON ai_sentiment(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_sentiment_analyzed_at ON ai_sentiment(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sentiment_symbol_analyzed ON ai_sentiment(symbol, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sentiment_articles_sentiment_id ON ai_sentiment_articles(sentiment_id);

-- Add comments
COMMENT ON TABLE ai_sentiment IS 'Stores AI-generated sentiment analysis for assets';
COMMENT ON TABLE ai_sentiment_articles IS 'Stores top contributing articles for sentiment analysis';
