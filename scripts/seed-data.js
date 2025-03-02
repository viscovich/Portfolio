// This script would normally seed the Supabase database with initial data
// For demo purposes, it's just a placeholder

console.log('Seeding database with initial data...');

// Example SQL for creating tables in Supabase

/*
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
  risk_score DECIMAL
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  description TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_assets table
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id),
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
*/

// Example of inserting data
/*
-- Insert sample assets
INSERT INTO assets (ticker, name, type, description, sector, region)
VALUES
  ('VTI', 'Vanguard Total Stock Market ETF', 'ETF', 'Provides exposure to the entire U.S. equity market', 'Broad Market', 'US'),
  ('VXUS', 'Vanguard Total International Stock ETF', 'ETF', 'Provides exposure to international stocks', 'Broad Market', 'International'),
  ('BND', 'Vanguard Total Bond Market ETF', 'ETF', 'Provides exposure to the U.S. investment-grade bond market', 'Bonds', 'US'),
  ('BNDX', 'Vanguard Total International Bond ETF', 'ETF', 'Provides exposure to international investment-grade bonds', 'Bonds', 'International'),
  ('VGT', 'Vanguard Information Technology ETF', 'ETF', 'Provides exposure to stocks in the information technology sector', 'Technology', 'US'),
  ('VHT', 'Vanguard Health Care ETF', 'ETF', 'Provides exposure to stocks in the health care sector', 'Healthcare', 'US'),
  ('VDC', 'Vanguard Consumer Staples ETF', 'ETF', 'Provides exposure to stocks in the consumer staples sector', 'Consumer Staples', 'US'),
  ('VOX', 'Vanguard Communication Services ETF', 'ETF', 'Provides exposure to stocks in the communication services sector', 'Communication', 'US'),
  ('VCR', 'Vanguard Consumer Discretionary ETF', 'ETF', 'Provides exposure to stocks in the consumer discretionary sector', 'Consumer Discretionary', 'US'),
  ('VFH', 'Vanguard Financials ETF', 'ETF', 'Provides exposure to stocks in the financials sector', 'Financials', 'US');

-- Insert sample asset metrics
INSERT INTO asset_metrics (asset_id, price, return_1y, return_3y, volatility_3y, sharpe_3y, dividend_yield, expense_ratio, risk_score)
VALUES
  (1, 235.67, 15.2, 42.5, 18.3, 1.8, 1.5, 0.03, 6.5),
  (2, 56.78, 8.7, 25.3, 19.1, 1.2, 2.8, 0.08, 7.2),
  (3, 80.12, -3.1, 5.2, 5.8, 0.5, 2.5, 0.035, 3.5),
  (4, 54.32, -2.5, 3.8, 6.2, 0.4, 2.2, 0.08, 3.8),
  (5, 450.21, 28.4, 85.3, 25.7, 2.8, 0.7, 0.1, 8.5),
  (6, 260.45, 18.7, 45.2, 17.5, 2.1, 1.3, 0.1, 7.0),
  (7, 195.67, 5.2, 18.7, 12.3, 1.1, 2.3, 0.1, 5.5),
  (8, 115.34, 12.5, 35.6, 20.1, 1.5, 1.1, 0.1, 7.5),
  (9, 305.78, 15.8, 52.3, 22.5, 1.9, 0.8, 0.1, 8.0),
  (10, 95.43, 10.2, 30.5, 21.2, 1.3, 1.9, 0.1, 7.8);

-- Insert sample market sentiment
INSERT INTO market_sentiment (date, sentiment_score, summary)
VALUES
  (NOW(), 0.7, 'Markets are showing positive momentum with technology and healthcare sectors leading the gains. Inflation concerns are subsiding, and central banks are expected to maintain current interest rates.'),
  (NOW() - INTERVAL '1 day', 0.3, 'Markets experienced volatility due to mixed economic data. Consumer discretionary and energy sectors underperformed, while defensive sectors showed resilience.'),
  (NOW() - INTERVAL '2 days', 0.5, 'Markets closed flat as investors await key economic reports. International markets outperformed domestic ones, with emerging markets showing strength.');
*/

console.log('Database seeding completed!');