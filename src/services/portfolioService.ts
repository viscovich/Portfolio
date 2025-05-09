import { supabase } from '../lib/supabase';
import { getRandomChartData, calculatePortfolioMetrics } from '../lib/utils';
import type { Portfolio, PortfolioAsset, Asset, AssetMetrics, AIPortfolioRequest } from '../types';

// Start with an empty list of portfolios
const mockPortfolios: Portfolio[] = [];
const mockPortfolioAssets: Record<number, PortfolioAsset[]> = {};

// Mock assets data (universe of available assets)
const mockAssets: Asset[] = [
  { id: 1, ticker: 'IDX000000000', name: 'Liquidità', type: 'Cash', sector: null, region: null, description: 'Liquidità' },
  { id: 2, ticker: 'LU1190417599', name: 'Obbligazionari Monetari', type: 'Bond', sector: 'Monetary', region: 'Global', description: 'Obbligazionari Monetari' },
  { id: 3, ticker: 'LU1287023003', name: 'Obbligazionari Governativi', type: 'Bond', sector: 'Government', region: 'Global', description: 'Obbligazionari Governativi' },
  { id: 4, ticker: 'IE000JBB8CR7', name: 'Obbligazionari Corporate', type: 'Bond', sector: 'Corporate', region: 'Global', description: 'Obbligazionari Corporate' },
  { id: 5, ticker: 'LU1686830909', name: 'Obbligazionari Emerging Markets', type: 'Bond', sector: 'Emerging Markets', region: 'Emerging Markets', description: 'Obbligazionari Emerging Markets' },
  { id: 6, ticker: 'LU1215415214', name: 'Obbligazionari High Yield', type: 'Bond', sector: 'High Yield', region: 'Global', description: 'Obbligazionari High Yield' },
  { id: 7, ticker: 'LU1650491282', name: 'Obbligazionari Altri', type: 'Bond', sector: 'Various', region: 'Global', description: 'Obbligazionari Altri' },
  { id: 8, ticker: 'IE00B643RZ01', name: 'Absolute Return Hedge', type: 'Alternative', sector: 'Hedge Fund', region: 'Global', description: 'Absolute Return Hedge' },
  { id: 9, ticker: 'DE000ETF7011', name: 'Bilanciati', type: 'Multi-Asset', sector: 'Balanced', region: 'Global', description: 'Bilanciati' },
  { id: 10, ticker: 'IE000E66LX20', name: 'Azionari Settoriali', type: 'Stock', sector: 'Various Sectors', region: 'Global', description: 'Azionari Settoriali' },
  { id: 11, ticker: 'LU1829220216', name: 'Azionari Geografici', type: 'Stock', sector: 'Geographic Focus', region: 'Global', description: 'Azionari Geografici' },
  { id: 12, ticker: 'FR0010429068', name: 'Azionari Emerging Markets', type: 'Stock', sector: 'Emerging Markets', region: 'Emerging Markets', description: 'Azionari Emerging Markets' }
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

// Note: The generation of mockPortfolioAssets and calculation of metrics for mockPortfolios
// is removed as mockPortfolios now starts empty. These will be populated dynamically.

// Helper to parse percentage strings like "12.34%" or "-1.23%" to numbers
function parsePercentageString(value?: string): number | undefined {
  if (typeof value !== 'string') return undefined;
  const num = parseFloat(value.replace('%', ''));
  return isNaN(num) ? undefined : num;
}

export async function getPortfolios(): Promise<Portfolio[]> {
  try {
    return [...mockPortfolios]; // Return a copy
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
}

export async function getPortfolioById(id: number): Promise<Portfolio | null> {
  try {
    const portfolio = mockPortfolios.find(p => p.id === id);
    if (!portfolio) return null;
    
    // Deep copy to avoid modifying original mock data if details are changed later
    const portfolioCopy = JSON.parse(JSON.stringify(portfolio));
    portfolioCopy.assets = mockPortfolioAssets[portfolio.id] ? JSON.parse(JSON.stringify(mockPortfolioAssets[portfolio.id])) : [];
    return portfolioCopy;

  } catch (error) {
    console.error(`Error fetching portfolio ${id}:`, error);
    return null;
  }
}

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at' | 'assets' | 'metrics'>): Promise<Portfolio | null> {
  try {
    const newPortfolio: Portfolio = {
      id: mockPortfolios.length + 1,
      created_at: new Date().toISOString(),
      ...portfolio,
      assets: [], // Initialize with empty assets
      metrics: calculatePortfolioMetrics([]), // Initialize with zeroed metrics
    };
    
    mockPortfolios.push(newPortfolio);
    mockPortfolioAssets[newPortfolio.id] = []; // Initialize in mockPortfolioAssets
    return JSON.parse(JSON.stringify(newPortfolio));
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return null;
  }
}

export async function createAIPortfolio(request: AIPortfolioRequest): Promise<Portfolio | null> {
  try {
    let riskDescription: string;
    if (request.optimization_strategy === 'risk_level' && request.risk_level !== undefined) {
      riskDescription = `DRC level ${request.risk_level} (on a scale of 1-5)`;
    } else if (request.optimization_strategy === 'sharpe_ratio') {
      riskDescription = 'optimized for maximum Sharpe ratio';
    } else {
      riskDescription = 'AI-recommended risk profile';
    }
    
    let portfolioName = `AI Portfolio ${new Date().toLocaleDateString()}`;
    if (request.optimization_strategy === 'risk_level') {
      if (request.drc_final_str && request.drc_final_str.trim() !== '') {
        portfolioName += ` DRC ${request.drc_final_str}`;
      } else if (request.risk_level !== undefined) {
        portfolioName += ` DRC ${request.risk_level}`;
      }
    }

    const newPortfolioData: Omit<Portfolio, 'id' | 'created_at' | 'assets' | 'metrics'> = {
        name: portfolioName,
        user_id: 'user-123', // Assuming a default user
        description: `AI-generated portfolio based on ${request.stocks_percentage}% stocks, ${request.bonds_percentage}% bonds, ${request.alternatives_percentage}% alternatives with ${riskDescription}`,
        is_ai_generated: true,
    };

    const createdPortfolioBase = await createPortfolio(newPortfolioData);
    if (!createdPortfolioBase) {
        throw new Error("Base portfolio creation failed");
    }
    
    const portfolioAssetsForStorage: PortfolioAsset[] = [];
    
    if (request.suggested_assets && request.suggested_assets.length > 0) {
      request.suggested_assets.forEach((suggestedAsset, index) => {
        let assetIdToUse: number;
        let assetDefinition: Asset;

        const existingMockAsset = mockAssets.find(a => a.ticker === suggestedAsset.ticker);
        
        if (existingMockAsset) {
          assetIdToUse = existingMockAsset.id;
          assetDefinition = { ...existingMockAsset };
        } else {
          const newAssetId = mockAssets.length + 1;
          const newAsset: Asset = {
            id: newAssetId,
            ticker: suggestedAsset.ticker,
            name: suggestedAsset.name, 
            type: suggestedAsset.type, 
            description: `${suggestedAsset.name} (${suggestedAsset.ticker})`,
            sector: null,
            region: null
          };
          mockAssets.push(newAsset); 
          assetIdToUse = newAssetId;
          assetDefinition = { ...newAsset };
          
          // Create default metrics for the truly new asset
           mockAssetMetrics[assetIdToUse] = {
            id: assetIdToUse,
            asset_id: assetIdToUse,
            date: new Date().toISOString(),
            price: parseFloat((Math.random() * 500 + 50).toFixed(2)),
            return_1y: 0, // Default to 0, will be overridden if img data exists
            return_3y: 0, // Default to 0
            volatility_3y: 0, // Default to 0
            sharpe_3y: parseFloat((Math.random() * 3).toFixed(2)),
            dividend_yield: parseFloat((Math.random() * 5).toFixed(2)),
            expense_ratio: parseFloat((Math.random() * 1).toFixed(2)),
            risk_score: parseFloat((Math.random() * 10).toFixed(2)),
            chart_data: getRandomChartData(30, 'volatile')
          };
        }

        // Ensure mockAssetMetrics entry exists (it should if existingMockAsset was found, or created if new)
        if (!mockAssetMetrics[assetIdToUse]) { 
            // This case should ideally be covered by the new asset creation logic above,
            // but as a safeguard, create default metrics here too.
            mockAssetMetrics[assetIdToUse] = {
                id: assetIdToUse,
                asset_id: assetIdToUse,
                date: new Date().toISOString(),
                price: parseFloat((Math.random() * 500 + 50).toFixed(2)),
                return_1y: 0, 
                return_3y: 0, 
                volatility_3y: 0, 
                sharpe_3y: parseFloat((Math.random() * 3).toFixed(2)),
                dividend_yield: parseFloat((Math.random() * 5).toFixed(2)),
                expense_ratio: parseFloat((Math.random() * 1).toFixed(2)),
                risk_score: parseFloat((Math.random() * 10).toFixed(2)),
                chart_data: getRandomChartData(30, 'volatile')
            };
        }
        
        // Override metrics with values from image data if provided
        const r1y_from_img = parsePercentageString(suggestedAsset.return1y_img);
        const r3y_from_img = parsePercentageString(suggestedAsset.return3y_img);
        const vol_from_img = parsePercentageString(suggestedAsset.volatility_img);

        if (r1y_from_img !== undefined) {
          mockAssetMetrics[assetIdToUse].return_1y = r1y_from_img;
        }
        if (r3y_from_img !== undefined) {
          mockAssetMetrics[assetIdToUse].return_3y = r3y_from_img;
        }
        if (vol_from_img !== undefined) {
          mockAssetMetrics[assetIdToUse].volatility_3y = vol_from_img;
        }
        
        portfolioAssetsForStorage.push({
          id: createdPortfolioBase.id * 100 + index, // Ensure unique ID for portfolio asset entry
          portfolio_id: createdPortfolioBase.id,
          asset_id: assetIdToUse,
          allocation: suggestedAsset.allocation,
          asset: { 
            ...assetDefinition,
            metrics: { ...mockAssetMetrics[assetIdToUse] } // Attach the (potentially updated) metrics
          }
        });
      });
    }
    
    // Calculate base metrics (which includes calculated returns and random placeholders for others)
    const calculatedMetrics = calculatePortfolioMetrics(portfolioAssetsForStorage);

    // Parse DR and DRC strings from request if they exist (from webhook)
    const drOptimizedNum = request.dr_optimized_str ? parseFloat(request.dr_optimized_str) : undefined;
    const drcFinalNum = request.drc_final_str ? parseInt(request.drc_final_str, 10) : undefined; // DRC seems to be an integer

    // Override calculated/placeholder metrics if values from webhook are valid
    if (drOptimizedNum !== undefined && !isNaN(drOptimizedNum)) {
        calculatedMetrics.dr_optimized = drOptimizedNum;
    }
    if (drcFinalNum !== undefined && !isNaN(drcFinalNum)) {
        calculatedMetrics.risk_score = drcFinalNum; // Override risk_score with DRC from webhook
    }

    // Update the portfolio in mockPortfolios and mockPortfolioAssets
    const portfolioIndex = mockPortfolios.findIndex(p => p.id === createdPortfolioBase.id);
    if (portfolioIndex !== -1) {
        mockPortfolios[portfolioIndex].assets = portfolioAssetsForStorage;
        mockPortfolios[portfolioIndex].metrics = calculatedMetrics; // Use the final metrics object
        mockPortfolioAssets[createdPortfolioBase.id] = portfolioAssetsForStorage;
        // Return a deep copy of the final portfolio object
        return JSON.parse(JSON.stringify(mockPortfolios[portfolioIndex]));
    }
    
    return null; // Should not happen if base portfolio was created
  } catch (error) {
    console.error('Error creating AI portfolio:', error);
    return null;
  }
}

export async function getAssets(): Promise<Asset[]> {
  try {
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
