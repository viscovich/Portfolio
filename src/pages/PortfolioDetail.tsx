import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, RefreshCw, Download, Trash2, Settings } from 'lucide-react';
import { getPortfolioById } from '../services/portfolioService';
import { formatPercentage, formatDateShort, getColorForPerformance, getRandomChartData } from '../lib/utils';
import { rebalancePortfolio } from '../services/aiService';
import PortfolioChart from '../components/PortfolioChart';
import AIAnalysisModal from '../components/AIAnalysisModal';
import AISettingsModal from '../components/AISettingsModal';
import type { Portfolio } from '../types';

const PortfolioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
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
            onClick={async () => {
              if (!id) return;
              setIsRebalancing(true);
              try {
                const result = await rebalancePortfolio(parseInt(id));
                setRebalanceResult(result);
                // Refresh portfolio data after rebalancing
                const updatedPortfolio = await getPortfolioById(parseInt(id));
                setPortfolio(updatedPortfolio);
              } catch (error) {
                console.error('Error rebalancing portfolio:', error);
              } finally {
                setIsRebalancing(false);
              }
            }}
            disabled={isRebalancing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-1 ${isRebalancing ? 'animate-spin' : ''}`} />
            {isRebalancing ? 'Rebalancing...' : 'Rebalance with AI'}
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
                <div className="text-sm text-gray-500 mb-1">Volatility 3Y</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatPercentage(portfolio.metrics?.volatility_3y || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Sharpe Ratio</div>
                <div className="text-xl font-semibold text-gray-900">
                  {portfolio.metrics?.sharpe_3y.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Dividend Yield</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatPercentage(portfolio.metrics?.dividend_yield || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Expense Ratio</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatPercentage(portfolio.metrics?.expense_ratio || 0)}
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
                    Asset
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{asset.asset.ticker}</div>
                          <div className="text-sm text-gray-500">{asset.asset.name}</div>
                        </div>
                      </div>
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
      
      {/* Display rebalance results if available */}
      {rebalanceResult && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Portfolio Rebalanced</h3>
          <p className="text-gray-700 mb-4">{rebalanceResult.summary}</p>
          
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Target
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rebalanceResult.current_vs_target.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.ticker}</div>
                      <div className="text-sm text-gray-500">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.current}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.target}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.action.includes('Reduce') ? 'bg-red-100 text-red-800' :
                        item.action.includes('Increase') ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-1 list-disc list-inside text-gray-700">
              {rebalanceResult.recommendations.map((recommendation: string, index: number) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button 
              onClick={async () => {
                if (!id || !portfolio || !rebalanceResult) return;
                
                try {
                  setIsLoading(true);
                  
                  // Create a deep copy of the portfolio to modify
                  const updatedPortfolio = JSON.parse(JSON.stringify(portfolio));
                  
                  // Update the portfolio assets with the new allocations
                  if (updatedPortfolio.assets && updatedPortfolio.assets.length > 0) {
                    rebalanceResult.current_vs_target.forEach((targetAsset: { ticker: string; target: number }) => {
                      // Find the matching asset in the portfolio
                      const portfolioAsset = updatedPortfolio.assets.find(
                        (asset: { asset: { ticker: string } }) => asset.asset.ticker === targetAsset.ticker
                      );
                      
                      // Update the allocation if the asset is found
                      if (portfolioAsset) {
                        portfolioAsset.allocation = targetAsset.target;
                      }
                    });
                  }
                  
                  // In a real app, you would call an API endpoint to save the changes
                  // For example: await updatePortfolio(updatedPortfolio);
                  
                  // Wait a moment to simulate the API call
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Update the portfolio state with the modified portfolio
                  setPortfolio(updatedPortfolio);
                  
                  // Clear the rebalance result
                  setRebalanceResult(null);
                  
                  // Show success message
                  alert('Portfolio successfully rebalanced!');
                } catch (error) {
                  console.error('Error applying rebalance:', error);
                  alert('Failed to apply rebalance changes.');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Accept Changes
            </button>
            <button 
              onClick={() => setRebalanceResult(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      <AIAnalysisModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        portfolioId={parseInt(id || '0')}
      />
      
      <AISettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default PortfolioDetail;
