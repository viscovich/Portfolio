import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, RefreshCw, Download, Trash2, Settings } from 'lucide-react';
import { getPortfolioById } from '../services/portfolioService';
import { formatPercentage, formatDateShort, getColorForPerformance, getRandomChartData } from '../lib/utils';
import { rebalancePortfolio } from '../services/aiService';
import PortfolioChart from '../components/PortfolioChart';
import AIAnalysisModal from '../components/AIAnalysisModal';
import AISettingsModal from '../components/AISettingsModal';
import RebalanceModal from '../components/RebalanceModal';
import type { Portfolio } from '../types';

const PortfolioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState<boolean>(false);
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);
  const [rebalanceResult, setRebalanceResult] = useState<any>(null);
  
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getPortfolioById(parseInt(id));
        setPortfolio(data);
        
        // Generate mock chart data
        setChartData(getRandomChartData(30, (data?.metrics?.return_3y || 0) > 0 ? 'up' : 'down'));
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!portfolio) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Portfolio not found.</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
          {portfolio.is_ai_generated && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              AI Generated
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <BarChart2 className="h-5 w-5 mr-1" />
            AI Analysis
          </button>
          <button 
            onClick={() => setIsRebalanceModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
          >
            <RefreshCw className="h-5 w-5 mr-1" />
            Rebalance with AI
          </button>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Portfolio Overview</h2>
            <span className="text-sm text-gray-500">Created: {formatDateShort(portfolio.created_at)}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <PortfolioChart data={chartData} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Return 1Y</div>
                <div className={`text-xl font-semibold ${getColorForPerformance(portfolio.metrics?.return_1y || 0)}`}>
                  {formatPercentage(portfolio.metrics?.return_1y || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Return 3Y</div>
                <div className={`text-xl font-semibold ${getColorForPerformance(portfolio.metrics?.return_3y || 0)}`}>
                  {formatPercentage(portfolio.metrics?.return_3y || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">DR Ottimizzato</div>
                <div className="text-xl font-semibold text-gray-900">
                  {typeof portfolio.metrics?.dr_optimized === 'number' 
                    ? portfolio.metrics.dr_optimized.toFixed(2) 
                    : 'N/A'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">DRC</div>
                <div className="text-xl font-semibold text-gray-900">
                  {Math.min(Math.max(Math.round(portfolio.metrics?.risk_score || 0), 1), 5)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Portfolio Composition</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ISIN
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return 1Y
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return 3Y
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volatility
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.assets?.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {asset.asset.ticker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.asset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.asset.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPercentage(asset.allocation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getColorForPerformance(asset.asset.metrics?.return_1y || 0)}`}>
                        {formatPercentage(asset.asset.metrics?.return_1y || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getColorForPerformance(asset.asset.metrics?.return_3y || 0)}`}>
                        {formatPercentage(asset.asset.metrics?.return_3y || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercentage(asset.asset.metrics?.volatility_3y || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-8 w-20">
                        <svg viewBox="0 0 100 30" className="h-full w-full">
                          <path
                            d={`M0,15 Q25,${Math.random() * 20} 50,${Math.random() * 20} T100,${Math.random() * 20}`}
                            fill="none"
                            stroke={(asset.asset.metrics?.return_3y || 0) > 0 ? "#10b981" : "#ef4444"}
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center">
              <Download className="h-5 w-5 mr-1" />
              Export
            </button>
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center">
              <Trash2 className="h-5 w-5 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
      
      {/* The Portfolio Rebalanced section has been removed as all rebalancing now happens in the modal */}
      
      <AIAnalysisModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        portfolioId={parseInt(id || '0')}
      />
      
      <AISettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      <RebalanceModal
        isOpen={isRebalanceModalOpen}
        onClose={() => {
          setIsRebalanceModalOpen(false);
          // Reset rebalance result when closing the modal
          setRebalanceResult(null);
        }}
        isLoading={isRebalancing}
        rebalanceResult={rebalanceResult}
        portfolioAssets={portfolio?.assets || []}
        onRebalance={async (optimizationStrategy, riskLevel) => {
          try {
            setIsRebalancing(true);
            console.log('onRebalance called with:', { optimizationStrategy, riskLevel });
            
            if (id) {
              const result = await rebalancePortfolio(
                parseInt(id),
                optimizationStrategy,
                riskLevel
              );
              setRebalanceResult(result);
            }
          } catch (error) {
            console.error('Error rebalancing portfolio:', error);
          } finally {
            setIsRebalancing(false);
          }
        }}
        onApplyChanges={(suggestions) => {
          if (!portfolio || !portfolio.assets) return;
          
          console.log('Applying changes to portfolio:', suggestions);
          
          // Create a copy of the portfolio to update
          const updatedPortfolio = { ...portfolio };
          
          // Update the allocations for each asset
          updatedPortfolio.assets = portfolio.assets.map(asset => {
            // Find the matching suggestion
            const suggestion = suggestions.find(s => s.ticker === asset.asset.ticker);
            
            if (suggestion) {
              // Update the allocation
              return {
                ...asset,
                allocation: suggestion.allocation
              };
            }
            
            // No change for this asset
            return asset;
          });
          
          // Update the portfolio state
          setPortfolio(updatedPortfolio);
        }}
      />
    </div>
  );
};

export default PortfolioDetail;
