/*
  # Create initial schema for investment portfolio application

  1. New Tables
    - `assets` - Stores ETFs and funds information
    - `asset_metrics` - Stores performance metrics for assets
    - `portfolios` - Stores user portfolios
    - `portfolio_assets` - Junction table for portfolio-asset relationships
    - `market_sentiment` - Stores market sentiment analysis
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_metrics table
CREATE TABLE IF NOT EXISTS asset_metrics (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price DECIMAL NOT NULL,
  return_1y DECIMAL,
  return_3y DECIMAL,
  volatility_3y DECIMAL,
  sharpe_3y DECIMAL,
  dividend_yield DECIMAL,
  expense_ratio DECIMAL,
  risk_score DECIMAL,
  chart_data JSONB
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  description TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_assets table
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id INTEGER REFERENCES assets(id),
  allocation DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create market_sentiment table
CREATE TABLE IF NOT EXISTS market_sentiment (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sentiment_score DECIMAL NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sentiment ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all assets"
  ON assets FOR SELECT
  USING (true);

CREATE POLICY "Users can read all asset metrics"
  ON asset_metrics FOR SELECT
  USING (true);

CREATE POLICY "Users can read all market sentiment"
  ON market_sentiment FOR SELECT
  USING (true);

CREATE POLICY "Users can read own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own portfolio assets"
  ON portfolio_assets FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own portfolio assets"
  ON portfolio_assets FOR INSERT
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own portfolio assets"
  ON portfolio_assets FOR UPDATE
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own portfolio assets"
  ON portfolio_assets FOR DELETE
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );