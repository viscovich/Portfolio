import { supabase } from '../lib/supabase';
import { getRandomChartData, calculatePortfolioMetrics } from '../lib/utils';
import type { Portfolio, PortfolioAsset, Asset, AssetMetrics } from '../types';

// Mock data for development
const mockPortfolios: Portfolio[] = [
  {
    id: 1,
    name: 'test dragon',
    created_at: '2025/05/05 19:02',
    user_id: 'user-123',
    description: 'Test portfolio with various ETFs',
    is_ai_generated: false
  },
  {
    id: 2,
    name: 'Capitolo test',
    created_at: '2025/05/05 18:16',
    user_id: 'user-123',
    description: 'Balanced portfolio for medium risk',
    is_ai_generated: false
  },
  {
    id: 3,
    name: 'etfs test',
    created_at: '2025/05/05 14:14',
    user_id: 'user-123',
    description: 'ETF-only portfolio',
    is_ai_generated: false
  },
  {
    id: 4,
    name: 'tomapicci',
    created_at: '2025/05/05 11:17',
    user_id: 'user-123',
    description: 'High growth portfolio',
    is_ai_generated: false
  },
  {
    id: 5,
    name: 'top 10 etf dr',
    created_at: '2025/05/05 14:35',
    user_id: 'user-123',
    description: 'Top 10 ETFs by performance',
    is_ai_generated: true
  },
  {
    id: 6,
    name: 'top 10 funds UI',
    created_at: '2025/01/25 17:30',
    user_id: 'user-123',
    description: 'Top 10 mutual funds',
    is_ai_generated: true
  }
];

// Mock assets data
const mockAssets: Asset[] = [
  { id: 1, ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', sector: 'Broad Market', region: 'US', description: 'US Total Market Index' },
  { id: 2, ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', type: 'ETF', sector: 'Broad Market', region: 'International', description: 'International Stock Index' },
  { id: 3, ticker: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'ETF', sector: 'Bonds', region: 'US', description: 'US Bond Index' },
  { id: 4, ticker: 'BNDX', name: 'Vanguard Total International Bond ETF', type: 'ETF', sector: 'Bonds', region: 'International', description: 'International Bond Index' },
  { id: 5, ticker: 'VGT', name: 'Vanguard Information Technology ETF', type: 'ETF', sector: 'Technology', region: 'US', description: 'Technology Sector' },
  { id: 6, ticker: 'VHT', name: 'Vanguard Health Care ETF', type: 'ETF', sector: 'Healthcare', region: 'US', description: 'Healthcare Sector' },
  { id: 7, ticker: 'VDC', name: 'Vanguard Consumer Staples ETF', type: 'ETF', sector: 'Consumer Staples', region: 'US', description: 'Consumer Staples Sector' },
  { id: 8, ticker: 'VOX', name: 'Vanguard Communication Services ETF', type: 'ETF', sector: 'Communication', region: 'US', description: 'Communication Sector' },
  { id: 9, ticker: 'VCR', name: 'Vanguard Consumer Discretionary ETF', type: 'ETF', sector: 'Consumer Discretionary', region: 'US', description: 'Consumer Discretionary Sector' },
  { id: 10, ticker: 'VFH', name: 'Vanguard Financials ETF', type: 'ETF', sector: 'Financials', region: 'US', description: 'Financial Sector' }
];

// Generate mock metrics for each asset
const mockAssetMetrics: Record<number, AssetMetrics> = {};
mockAssets.forEach(asset => {
  mockAssetMetrics[asset.id] = {
    id: asset.id,
    asset_id: asset.id,
    date: new Date().toISOString(),
    price: parseFloat((Math.random() * 500 + 50).toFixed(2)),
    return_1y: parseFloat((Math.random() * 30 - 5).toFixed(2)),
    return_3y: parseFloat((Math.random() * 60 - 10).toFixed(2)),
    volatility_3y: parseFloat((Math.random() * 20 + 5).toFixed(2)),
    sharpe_3y: parseFloat((Math.random() * 3).toFixed(2)),
    dividend_yield: parseFloat((Math.random() * 5).toFixed(2)),
    expense_ratio: parseFloat((Math.random() * 1).toFixed(2)),
    risk_score: parseFloat((Math.random() * 10).toFixed(2)),
    chart_data: getRandomChartData(30, Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'volatile')
  };
});

// Generate mock portfolio assets
const mockPortfolioAssets: Record<number, PortfolioAsset[]> = {};
mockPortfolios.forEach(portfolio => {
  const assetCount = Math.floor(Math.random() * 5) + 3; // 3-7 assets per portfolio
  const assets: PortfolioAsset[] = [];
  
  // Select random assets
  const selectedAssetIds = new Set<number>();
  while (selectedAssetIds.size < assetCount) {
    const assetId = Math.floor(Math.random() * mockAssets.length) + 1;
    selectedAssetIds.add(assetId);
  }
  
  // Create portfolio assets with allocations
  let remainingAllocation = 100;
  const assetIds = Array.from(selectedAssetIds);
  
  assetIds.forEach((assetId, index) => {
    const isLast = index === assetIds.length - 1;
    const allocation = isLast ? remainingAllocation : Math.floor(Math.random() * remainingAllocation * 0.7);
    remainingAllocation -= allocation;
    
    const asset = mockAssets.find(a => a.id === assetId)!;
    const metrics = mockAssetMetrics[assetId];
    
    assets.push({
      id: portfolio.id * 100 + index,
      portfolio_id: portfolio.id,
      asset_id: assetId,
      allocation,
      asset: {
        ...asset,
        metrics
      }
    });
  });
  
  mockPortfolioAssets[portfolio.id] = assets;
});

// Calculate portfolio metrics
mockPortfolios.forEach(portfolio => {
  const assets = mockPortfolioAssets[portfolio.id] || [];
  portfolio.assets = assets;
  portfolio.metrics = calculatePortfolioMetrics(assets);
});

export async function getPortfolios(): Promise<Portfolio[]> {
  try {
    // In a real app, this would fetch from Supabase
    // const { data, error } = await supabase
    //   .from('portfolios')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    
    // if (error) throw error;
    // return data;
    
    return mockPortfolios;
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
}

export async function getPortfolioById(id: number): Promise<Portfolio | null> {
  try {
    // In a real app, this would fetch from Supabase with joins
    // const { data, error } = await supabase
    //   .from('portfolios')
    //   .select(`
    //     *,
    //     portfolio_assets(
    //       *,
    //       asset:assets(*)
    //     )
    //   `)
    //   .eq('id', id)
    //   .single();
    
    // if (error) throw error;
    // return data;
    
    const portfolio = mockPortfolios.find(p => p.id === id);
    if (!portfolio) return null;
    
    return {
      ...portfolio,
      assets: mockPortfolioAssets[portfolio.id] || []
    };
  } catch (error) {
    console.error(`Error fetching portfolio ${id}:`, error);
    return null;
  }
}

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at'>): Promise<Portfolio | null> {
  try {
    // In a real app, this would insert into Supabase
    // const { data, error } = await supabase
    //   .from('portfolios')
    //   .insert(portfolio)
    //   .select()
    //   .single();
    
    // if (error) throw error;
    // return data;
    
    const newPortfolio: Portfolio = {
      id: mockPortfolios.length + 1,
      created_at: new Date().toISOString(),
      ...portfolio,
      assets: [],
      metrics: {
        return_1y: 0,
        return_3y: 0,
        volatility_3y: 0,
        sharpe_3y: 0,
        dividend_yield: 0,
        expense_ratio: 0,
        risk_score: 0,
        asset_count: 0
      }
    };
    
    mockPortfolios.push(newPortfolio);
    return newPortfolio;
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return null;
  }
}

export async function createAIPortfolio(request: any): Promise<Portfolio | null> {
  try {
    // This would normally call an AI service
    // For demo, we'll create a portfolio with random assets
    const newPortfolio: Portfolio = {
      id: mockPortfolios.length + 1,
      name: `AI Portfolio ${new Date().toLocaleDateString()}`,
      created_at: new Date().toISOString(),
      user_id: 'user-123',
      description: `AI-generated portfolio based on ${request.stocks_percentage}% stocks, ${request.bonds_percentage}% bonds, ${request.alternatives_percentage}% alternatives with ${request.risk_level} risk`,
      is_ai_generated: true,
      assets: [],
      metrics: {
        return_1y: 0,
        return_3y: 0,
        volatility_3y: 0,
        sharpe_3y: 0,
        dividend_yield: 0,
        expense_ratio: 0,
        risk_score: 0,
        asset_count: 0
      }
    };
    
    // Create portfolio assets based on allocation request
    const assets: PortfolioAsset[] = [];
    
    // Add stock ETFs
    const stockAssets = mockAssets.filter(a => a.sector !== 'Bonds');
    const stockAllocation = request.stocks_percentage;
    let remainingStockAllocation = stockAllocation;
    
    for (let i = 0; i < 3 && i < stockAssets.length; i++) {
      const asset = stockAssets[i];
      const isLast = i === 2 || i === stockAssets.length - 1;
      const allocation = isLast ? remainingStockAllocation : Math.floor(Math.random() * remainingStockAllocation * 0.7);
      remainingStockAllocation -= allocation;
      
      assets.push({
        id: newPortfolio.id * 100 + i,
        portfolio_id: newPortfolio.id,
        asset_id: asset.id,
        allocation,
        asset: {
          ...asset,
          metrics: mockAssetMetrics[asset.id]
        }
      });
    }
    
    // Add bond ETFs
    const bondAssets = mockAssets.filter(a => a.sector === 'Bonds');
    const bondAllocation = request.bonds_percentage;
    let remainingBondAllocation = bondAllocation;
    
    for (let i = 0; i < 2 && i < bondAssets.length; i++) {
      const asset = bondAssets[i];
      const isLast = i === 1 || i === bondAssets.length - 1;
      const allocation = isLast ? remainingBondAllocation : Math.floor(Math.random() * remainingBondAllocation * 0.7);
      remainingBondAllocation -= allocation;
      
      assets.push({
        id: newPortfolio.id * 100 + i + 3,
        portfolio_id: newPortfolio.id,
        asset_id: asset.id,
        allocation,
        asset: {
          ...asset,
          metrics: mockAssetMetrics[asset.id]
        }
      });
    }
    
    // Add alternative assets (using some ETFs as alternatives for demo)
    const altAllocation = request.alternatives_percentage;
    const altAsset = mockAssets[Math.floor(Math.random() * mockAssets.length)];
    
    assets.push({
      id: newPortfolio.id * 100 + 5,
      portfolio_id: newPortfolio.id,
      asset_id: altAsset.id,
      allocation: altAllocation,
      asset: {
        ...altAsset,
        metrics: mockAssetMetrics[altAsset.id]
      }
    });
    
    newPortfolio.assets = assets;
    newPortfolio.metrics = calculatePortfolioMetrics(assets);
    
    mockPortfolios.push(newPortfolio);
    mockPortfolioAssets[newPortfolio.id] = assets;
    
    return newPortfolio;
  } catch (error) {
    console.error('Error creating AI portfolio:', error);
    return null;
  }
}

export async function getAssets(): Promise<Asset[]> {
  try {
    // In a real app, this would fetch from Supabase
    // const { data, error } = await supabase
    //   .from('assets')
    //   .select('*')
    //   .order('name');
    
    // if (error) throw error;
    // return data;
    
    return mockAssets.map(asset => ({
      ...asset,
      metrics: mockAssetMetrics[asset.id]
    }));
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export async function getAssetById(id: number): Promise<Asset | null> {
  try {
    // In a real app, this would fetch from Supabase
    // const { data, error } = await supabase
    //   .from('assets')
    //   .select('*')
    //   .eq('id', id)
    //   .single();
    
    // if (error) throw error;
    // return data;
    
    const asset = mockAssets.find(a => a.id === id);
    if (!asset) return null;
    
    return {
      ...asset,
      metrics: mockAssetMetrics[asset.id]
    };
  } catch (error) {
    console.error(`Error fetching asset ${id}:`, error);
    return null;
  }
}