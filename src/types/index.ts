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
  risk_score: number; // Represents DRC
  asset_count: number;
  dr_optimized?: number; // Add field for Optimized DR from webhook
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
  detailed_data?: DetailedMarketSentiment;
}

export interface DetailedMarketSentiment {
  current_sentiment: {
    market_sentiment: {
      score: number;
      analysis: string;
    }
  };
  key_factors: {
    economic_data: {
      EU: {
        sentiment: string;
        analysis: string;
      };
      USA: {
        sentiment: string;
        analysis: string;
      };
    };
    central_bank_policy: {
      EU: {
        sentiment: string;
        analysis: string;
      };
      USA: {
        sentiment: string;
        analysis: string;
      };
    };
    corporate_earnings: {
      sentiment: string;
      analysis: string;
    };
    geopolitical_events: {
      sentiment: string;
      analysis: string;
    };
    global_sentiment_index: {
      sentiment: string;
      analysis: string;
    };
  };
  market_outlook: {
    equity_markets: {
      USA: MarketOutlookItem;
      EU: MarketOutlookItem;
      Italy: MarketOutlookItem;
      emerging_markets: MarketOutlookItem;
    };
    bond_markets: {
      USA: MarketOutlookItem;
      EU: MarketOutlookItem;
      Italy: MarketOutlookItem;
      emerging_markets: MarketOutlookItem;
    };
    commodities: {
      gold?: MarketOutlookItem;      // English names
      oil?: MarketOutlookItem;
      copper?: MarketOutlookItem;
      gas_natural?: MarketOutlookItem;
      pgm?: MarketOutlookItem;
      oro?: MarketOutlookItem;       // Italian names 
      petrolio?: MarketOutlookItem;
      rame?: MarketOutlookItem;
      gas_naturale?: MarketOutlookItem;
      metalli_pgm?: MarketOutlookItem;
    };
  };
  sector_outlook: {
    financials: SectorOutlookItem;
    real_estate: SectorOutlookItem;
    consumer_discretionary: SectorOutlookItem;
    technology: SectorOutlookItem;
    industrials: SectorOutlookItem;
    materials: SectorOutlookItem;
    consumer_staples: SectorOutlookItem;
    health_care: SectorOutlookItem;
    energy: SectorOutlookItem;
    communication_services: SectorOutlookItem;
    utilities: SectorOutlookItem;
  };
}

export interface MarketOutlookItem {
  sentiment: string;
  analysis: string;
  index: string;
}

export interface SectorOutlookItem {
  sentiment: string;
  analysis: string;
  index: string;
}

export interface AIPortfolioRequest {
  stocks_percentage: number;
  bonds_percentage: number;
  alternatives_percentage: number;
  optimization_strategy: 'risk_level' | 'sharpe_ratio' | 'ai_recommended';
  risk_level?: number; // Integer from 1 to 5, only used when optimization_strategy is 'risk_level'
  // Fields to carry DR/DRC strings from webhook response (portfolio level)
  dr_optimized_str?: string; 
  drc_final_str?: string;
  suggested_assets?: Array<{
    ticker: string;
    name: string;
    allocation: number;
    type: string;
    // Fields to carry metrics from the user's image data (asset level)
    return1y_img?: string;
    return3y_img?: string;
    volatility_img?: string;
  }>; // The suggested assets from the AI suggestion
}

export interface AIAnalysisRequest {
  portfolio_id: number;
  analysis_type: 'performance' | 'risk' | 'allocation';
}

export interface MarketNews {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  description?: string;
  imageUrl?: string;
}
