export interface Portfolio {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
  description: string | null;
  is_ai_generated: boolean;
  assets?: PortfolioAsset[];
  metrics?: PortfolioMetrics;
}

export interface PortfolioAsset {
  id: number;
  portfolio_id: number;
  asset_id: number;
  allocation: number;
  asset: Asset;
}

export interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
  description: string | null;
  sector: string | null;
  region: string | null;
  metrics?: AssetMetrics;
}

export interface AssetMetrics {
  id: number;
  asset_id: number;
  date: string;
  price: number;
  return_1y: number;
  return_3y: number;
  volatility_3y: number;
  sharpe_3y: number;
  dividend_yield: number;
  expense_ratio: number;
  risk_score: number;
  chart_data?: ChartPoint[];
}

export interface PortfolioMetrics {
  return_1y: number;
  return_3y: number;
  volatility_3y: number;
  sharpe_3y: number;
  dividend_yield: number;
  expense_ratio: number;
  risk_score: number;
  asset_count: number;
}

export interface ChartPoint {
  date: string;
  value: number;
}

export interface MarketSentiment {
  id: number;
  date: string;
  sentiment_score: number;
  summary: string;
  created_at: string;
}

export interface AIPortfolioRequest {
  stocks_percentage: number;
  bonds_percentage: number;
  alternatives_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface AIAnalysisRequest {
  portfolio_id: number;
  analysis_type: 'performance' | 'risk' | 'allocation' | 'rebalance';
}