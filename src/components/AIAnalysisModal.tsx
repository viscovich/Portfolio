import React, { useState } from 'react';
import { X, BarChart2, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPortfolioAnalysis } from '../services/aiService';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: number;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, portfolioId }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'risk' | 'allocation' | 'rebalance'>('performance');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const fetchAnalysis = async (analysisType: 'performance' | 'risk' | 'allocation' | 'rebalance') => {
    setLoading(true);
    try {
      const data = await getPortfolioAnalysis(portfolioId, analysisType);
      setAnalysis(data);
    } catch (error) {
      console.error(`Error fetching ${analysisType} analysis:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (tab: 'performance' | 'risk' | 'allocation' | 'rebalance') => {
    setActiveTab(tab);
    setAnalysis(null); // Reset analysis state before fetching new data
    fetchAnalysis(tab);
  };
  
  React.useEffect(() => {
    if (isOpen && !analysis) {
      fetchAnalysis('performance');
    }
  }, [isOpen, portfolioId]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">AI Portfolio Analysis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'performance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('performance')}
            >
              Performance
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'risk' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('risk')}
            >
              Risk Analysis
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'allocation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('allocation')}
            >
              Allocation
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'rebalance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('rebalance')}
            >
              Rebalance
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : analysis ? (
            <div>
              {activeTab === 'performance' && (
                <div>
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex items-start">
                      <BarChart2 className="h-5 w-5 text-blue-500 mt-1 mr-2" />
                      <p className="text-gray-700">{analysis.summary}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Best Performers</h3>
                      <div className="bg-white border border-gray-200 rounded-md">
                        {analysis.best_performers && analysis.best_performers.map((asset: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 border-b last:border-0">
                            <div>
                              <div className="font-medium text-gray-900">{asset.ticker}</div>
                              <div className="text-sm text-gray-500">{asset.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-500">+{asset.return_1y.toFixed(2)}%</div>
                              <div className="text-sm text-gray-500">Contribution: {asset.contribution.toFixed(2)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Worst Performers</h3>
                      <div className="bg-white border border-gray-200 rounded-md">
                        {analysis.worst_performers && analysis.worst_performers.map((asset: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 border-b last:border-0">
                            <div>
                              <div className="font-medium text-gray-900">{asset.ticker}</div>
                              <div className="text-sm text-gray-500">{asset.name}</div>
                            </div>
                            <div className="text-right">
                              <div className={asset.return_1y < 0 ? 'text-red-500' : 'text-green-500'}>
                                {asset.return_1y.toFixed(2)}%
                              </div>
                              <div className="text-sm text-gray-500">Contribution: {asset.contribution.toFixed(2)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'risk' && (
                <div>
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-blue-500 mt-1 mr-2" />
                      <p className="text-gray-700">{analysis.summary}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Factors</h3>
                  <div className="space-y-4 mb-6">
                    {analysis.risk_factors && analysis.risk_factors.map((factor: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900">{factor.factor}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            factor.exposure === 'Low' ? 'bg-green-100 text-green-800' :
                            factor.exposure === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {factor.exposure}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{factor.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'allocation' && (
                <div>
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex items-start">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-1 mr-2" />
                      <p className="text-gray-700">{analysis.summary}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Current vs. Benchmark Allocation</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Benchmark
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Difference
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analysis.current_allocation && analysis.current_allocation.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.allocation}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.benchmark}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`${
                                item.difference > 0 ? 'text-green-500' :
                                item.difference < 0 ? 'text-red-500' : 'text-gray-500'
                              }`}>
                                {item.difference > 0 ? '+' : ''}{item.difference}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeTab === 'rebalance' && (
                <div>
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-blue-500 mt-1 mr-2" />
                      <p className="text-gray-700">{analysis.summary}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Rebalancing Actions</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Asset
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Target
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analysis.current_vs_target && analysis.current_vs_target.map((item: any, index: number) => (
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
                  
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      Apply Rebalance
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">AI Recommendations</h3>
                <ul className="space-y-2">
                  {analysis.recommendations && analysis.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Select an analysis type to get AI insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;
