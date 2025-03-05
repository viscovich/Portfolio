import React, { useState, useEffect } from 'react';
import { X, Sliders, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { rebalancePortfolio } from '../services/aiService';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRebalance: (optimizationStrategy: 'risk_level' | 'sharpe_ratio' | 'ai_recommended', riskLevel?: number) => void;
  onApplyChanges: (suggestions: any[]) => void; // New prop to handle applying changes
  isLoading: boolean;
  rebalanceResult?: any;
  portfolioAssets?: any[]; // Current portfolio assets
}

const RebalanceModal: React.FC<RebalanceModalProps> = ({ 
  isOpen, 
  onClose, 
  onRebalance,
  onApplyChanges,
  isLoading, 
  rebalanceResult,
  portfolioAssets = [] 
}) => {
  // Debug log for props
  console.log('RebalanceModal props:', { 
    isOpen,
    isLoading,
    hasRebalanceResult: !!rebalanceResult,
    rebalanceResultStructure: rebalanceResult ? {
      hasSummary: !!rebalanceResult.summary,
      hasCurrentVsTarget: !!rebalanceResult.current_vs_target,
      hasRecommendations: !!rebalanceResult.recommendations,
      currentVsTargetLength: rebalanceResult.current_vs_target?.length
    } : null
  });
  const [optimizationStrategy, setOptimizationStrategy] = useState<'risk_level' | 'sharpe_ratio' | 'ai_recommended'>('risk_level');
  const [riskLevel, setRiskLevel] = useState<number>(3); // Default to middle risk level (3 out of 5)
  const [rebalanceComplete, setRebalanceComplete] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Debug log for state changes
  React.useEffect(() => {
    console.log('RebalanceModal state:', { 
      optimizationStrategy, 
      riskLevel, 
      step,
      rebalanceComplete,
      hasAiSuggestion: !!aiSuggestion,
      loading
    });
  }, [optimizationStrategy, riskLevel, step, rebalanceComplete, aiSuggestion, loading]);
  
  // Update rebalanceComplete state when rebalanceResult changes
  React.useEffect(() => {
    if (rebalanceResult) {
      setRebalanceComplete(true);
      console.log('Rebalance complete, result:', rebalanceResult);
    }
  }, [rebalanceResult]);

  const handleGetSuggestions = async () => {
    try {
      setLoading(true);
      console.log('Getting rebalance suggestions with:', {
        optimization_strategy: optimizationStrategy,
        risk_level: optimizationStrategy === 'risk_level' ? riskLevel : undefined
      });
      
      // Find the portfolio ID from the first asset
      const portfolioId = portfolioAssets.length > 0 ? portfolioAssets[0].portfolio_id : 0;
      
      // Use rebalancePortfolio which only redistributes existing assets
      const suggestion = await rebalancePortfolio(
        portfolioId,
        optimizationStrategy,
        optimizationStrategy === 'risk_level' ? riskLevel : undefined
      );
      
      console.log('Rebalance suggestion received:', suggestion);
      
      // Transform the rebalance result to match the expected format for the UI
      const transformedSuggestion = {
        suggestions: suggestion.current_vs_target.map(item => ({
          ticker: item.ticker,
          name: item.name,
          allocation: item.target,
          type: portfolioAssets.find(a => a.asset.ticker === item.ticker)?.asset.type || 'ETF'
        })),
        analysis: suggestion.summary,
        expected_return: "Based on rebalanced allocation",
        risk_assessment: optimizationStrategy === 'risk_level' 
          ? `DRC Level ${riskLevel}` 
          : optimizationStrategy === 'sharpe_ratio' 
            ? 'Optimized for Sharpe Ratio' 
            : 'AI Recommended'
      };
      
      setAiSuggestion(transformedSuggestion);
      setStep(2);
    } catch (error) {
      console.error('Error getting rebalance suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to find current allocation for a ticker
  const getCurrentAllocation = (ticker: string) => {
    const asset = portfolioAssets.find(a => a.asset.ticker === ticker);
    return asset ? asset.allocation : 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Rebalance Portfolio with AI</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {rebalanceResult ? (
            <div className="text-center py-4">
              <div className="mb-4 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Rebalancing Complete!</h3>
              <p className="text-gray-600 mb-6">
                Your portfolio has been successfully rebalanced. Click "View Results" to see the changes.
              </p>
            </div>
          ) : step === 1 ? (
            <>
              <p className="text-gray-600 mb-6">
                Choose how you want the AI to optimize your portfolio during rebalancing.
              </p>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Optimization Strategy</h3>
                <div className="space-y-3">
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${optimizationStrategy === 'risk_level' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
                    onClick={() => setOptimizationStrategy('risk_level')}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${optimizationStrategy === 'risk_level' ? 'border-blue-500' : 'border-gray-400'}`}>
                      {optimizationStrategy === 'risk_level' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                    </div>
                    <Sliders className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <div className="font-medium">Specify Risk Level (DRC)</div>
                      <div className="text-sm text-gray-500">Choose your desired risk level from 1 (lowest) to 5 (highest)</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${optimizationStrategy === 'sharpe_ratio' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
                    onClick={() => setOptimizationStrategy('sharpe_ratio')}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${optimizationStrategy === 'sharpe_ratio' ? 'border-blue-500' : 'border-gray-400'}`}>
                      {optimizationStrategy === 'sharpe_ratio' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                    </div>
                    <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <div className="font-medium">Maximize Sharpe Ratio</div>
                      <div className="text-sm text-gray-500">Optimize for the best risk-adjusted returns</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${optimizationStrategy === 'ai_recommended' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
                    onClick={() => setOptimizationStrategy('ai_recommended')}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${optimizationStrategy === 'ai_recommended' ? 'border-blue-500' : 'border-gray-400'}`}>
                      {optimizationStrategy === 'ai_recommended' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                    </div>
                    <Sparkles className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <div className="font-medium">AI Recommended</div>
                      <div className="text-sm text-gray-500">Let AI determine the optimal strategy based on market conditions</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {optimizationStrategy === 'risk_level' && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Risk Level (DRC)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">DRC Level: {riskLevel}</label>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      data-testid="risk-level-slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 (Conservative)</span>
                      <span>2</span>
                      <span>3 (Balanced)</span>
                      <span>4</span>
                      <span>5 (Aggressive)</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Always show a message about the next step */}
              <div className="mt-6 mb-4 text-sm text-gray-600">
                Click "Get AI Suggestions" to proceed with your selected optimization strategy
                {optimizationStrategy === 'risk_level' ? ` and risk level of ${riskLevel}` : ''}.
              </div>
            </>
          ) : step === 2 && aiSuggestion && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">AI Rebalance Suggestion</h3>
                <p className="text-gray-600 mb-4">{aiSuggestion.analysis || 'AI analysis not available'}</p>
                
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Expected Return:</span>
                    <span className="text-sm font-medium text-blue-700">{aiSuggestion.expected_return || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Risk Assessment:</span>
                    <span className="text-sm font-medium text-blue-700">
                      {optimizationStrategy === 'risk_level' 
                        ? `DRC Level ${riskLevel}` 
                        : optimizationStrategy === 'sharpe_ratio' 
                          ? 'Optimized for Sharpe Ratio' 
                          : 'AI Recommended'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current vs. Suggested Allocation</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Review the suggested changes to your portfolio allocation. The AI has analyzed your current holdings and recommended adjustments to optimize performance.
                </p>
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
                          Current
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Suggested
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aiSuggestion.suggestions?.map((asset: any, index: number) => {
                        const currentAllocation = getCurrentAllocation(asset.ticker);
                        const difference = asset.allocation - currentAllocation;
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{asset.ticker}</div>
                              <div className="text-sm text-gray-500">{asset.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {currentAllocation.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {typeof asset.allocation === 'number' ? asset.allocation.toFixed(1) : asset.allocation}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">What happens next?</h4>
                  <p className="text-sm text-yellow-700">
                    Clicking "Apply Suggested Changes" will update your portfolio with these new allocations. 
                    No actual trades will be executed - this is a simulation to help you plan your rebalancing strategy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fixed footer with buttons */}
          <div className="mt-8 border-t pt-4">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              
              {loading || isLoading ? (
                <button
                  disabled
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    {isLoading ? "Applying Changes..." : "Getting AI Suggestions..."}
                  </div>
                </button>
              ) : rebalanceResult ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View Results
                </button>
              ) : step === 1 ? (
                <button
                  onClick={handleGetSuggestions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  data-testid="get-ai-suggestions-button"
                >
                  Get AI Suggestions
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      console.log('Apply Suggested Changes button clicked');
                      
                      // Apply the changes to the portfolio
                      if (aiSuggestion && aiSuggestion.suggestions) {
                        onApplyChanges(aiSuggestion.suggestions);
                      }
                      
                      // Close the modal
                      onClose();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Apply Suggested Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebalanceModal;
