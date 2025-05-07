import React, { useState } from 'react';
import { X, Settings, Sliders, TrendingUp, Sparkles } from 'lucide-react';
import { createAIPortfolio } from '../services/portfolioService';
import { getAIPortfolioSuggestion, testAIConnection } from '../services/aiService';
import AISettingsModal from './AISettingsModal';

interface AIPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AIPortfolioModal: React.FC<AIPortfolioModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allocation, setAllocation] = useState({
    stocks: 60,
    bonds: 30,
    alternatives: 10
  });
  const [optimizationStrategy, setOptimizationStrategy] = useState<'risk_level' | 'sharpe_ratio' | 'ai_recommended'>('risk_level');
  const [riskLevel, setRiskLevel] = useState<number>(3); // Default to middle risk level (3 out of 5)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  
  const handleAllocationChange = (type: 'stocks' | 'bonds' | 'alternatives', value: number) => {
    // Ensure the total allocation is always 100%
    const newAllocation = { ...allocation, [type]: value };
    const total = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
    
    if (total !== 100) {
      // Adjust the other allocations proportionally
      const otherTypes = Object.keys(allocation).filter(t => t !== type) as Array<'stocks' | 'bonds' | 'alternatives'>;
      const currentOtherTotal = otherTypes.reduce((sum, t) => sum + newAllocation[t], 0);
      
      if (currentOtherTotal > 0) {
        const factor = (100 - value) / currentOtherTotal;
        otherTypes.forEach(t => {
          newAllocation[t] = Math.round(newAllocation[t] * factor);
        });
        
        // Ensure we still sum to 100 (handle rounding errors)
        const newTotal = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
        if (newTotal !== 100) {
          newAllocation[otherTypes[0]] += (100 - newTotal);
        }
      } else {
        // If other allocations are 0, distribute evenly
        const remaining = 100 - value;
        const perType = Math.floor(remaining / otherTypes.length);
        otherTypes.forEach((t, i) => {
          newAllocation[t] = perType + (i === 0 ? remaining % otherTypes.length : 0);
        });
      }
    }
    
    setAllocation(newAllocation);
  };
  
  const handleGetSuggestions = async () => {
    setLoading(true);
    setAiSuggestion(null); // Reset previous suggestions

    try {
      if (optimizationStrategy === 'risk_level') {
        const response = await fetch(`https://viscovich.duckdns.org/webhook/drc?profile=${riskLevel}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data && data.output) {
          const lines = data.output.split('\n');
          const suggestions: { ticker: string; name: string; type: string; allocation: number }[] = [];
          let analysisText = '';
          let drOptimized = '';
          let drcFinal = '';

          const assetRegex = /^([A-Z0-9]+):\s*([\d.]+)\s*%/;
          const drOptimizedRegex = /DR\s+ottimizzato\s*:\s*([\d.]+)/;
          const drcFinalRegex = /DRC\s+finale\s*:\s*([\d.]+)/;

          lines.forEach((line: string) => {
            const assetMatch = line.match(assetRegex);
            if (assetMatch) {
              const allocation = parseFloat(assetMatch[2]);
              if (allocation > 0) { // Only add if allocation is greater than 0
                suggestions.push({
                  ticker: assetMatch[1],
                  name: 'N/A', // Name not provided by this API
                  type: 'N/A', // Type not provided by this API
                  allocation: allocation,
                });
              }
            }
            const drOptMatch = line.match(drOptimizedRegex);
            if (drOptMatch) {
              drOptimized = drOptMatch[1];
            }
            const drcFinalMatch = line.match(drcFinalRegex);
            if (drcFinalMatch) {
              drcFinal = drcFinalMatch[1];
            }
          });
          
          analysisText = `Portfolio generated based on DRC Profile ${riskLevel}.`;
          if (drOptimized) {
            analysisText += ` Optimized DR: ${drOptimized}.`;
          }
          if (drcFinal) {
            analysisText += ` Final DRC: ${drcFinal}.`;
          }

          setAiSuggestion({
            analysis: analysisText,
            expected_return: 'N/A', // Not provided by this API
            suggestions: suggestions,
          });
          setStep(2);
        } else {
          throw new Error('Invalid data format from DRC API');
        }
      } else {
        // Original logic for other strategies
        const suggestion = await getAIPortfolioSuggestion({
          stocks_percentage: allocation.stocks,
          bonds_percentage: allocation.bonds,
          alternatives_percentage: allocation.alternatives,
          optimization_strategy: optimizationStrategy,
          // risk_level is not applicable here or handled by the service
        });
        setAiSuggestion(suggestion);
        setStep(2);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // Optionally, test AI connection or show a user-friendly error
      // const testResult = await testAIConnection();
      // console.log('AI Connection Test Result:', testResult);
      // For now, just log the error. Consider adding user feedback.
      setAiSuggestion({ 
        analysis: `Error fetching suggestions: ${error instanceof Error ? error.message : String(error)}`, 
        expected_return: 'N/A', 
        suggestions: [] 
      });
      setStep(2); // Go to step 2 to show the error message
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePortfolio = async () => {
    setLoading(true);
    try {
      await createAIPortfolio({
        stocks_percentage: allocation.stocks,
        bonds_percentage: allocation.bonds,
        alternatives_percentage: allocation.alternatives,
        optimization_strategy: optimizationStrategy,
        risk_level: optimizationStrategy === 'risk_level' ? riskLevel : undefined,
        suggested_assets: aiSuggestion?.suggestions // Pass the AI suggestions to the portfolio creation function
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating AI portfolio:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create AI Portfolio</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSettingsModalOpen(true)} 
              className="text-gray-500 hover:text-gray-700"
              title="AI Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <div>

              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Optimization Strategy</h3>
                <div className="space-y-3">
                  <div> {/* Wrapper for Specify Risk Level and its slider */}
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
                    {optimizationStrategy === 'risk_level' && (
                      <div className="ml-10 mt-3 mb-3 pr-3"> {/* Moved and restyled slider section */}
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

              {(optimizationStrategy === 'sharpe_ratio' || optimizationStrategy === 'ai_recommended') && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Asset Allocation</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Stocks: {allocation.stocks}%</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={allocation.stocks}
                        onChange={(e) => handleAllocationChange('stocks', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Bonds: {allocation.bonds}%</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={allocation.bonds}
                        onChange={(e) => handleAllocationChange('bonds', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Alternatives: {allocation.alternatives}%</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={allocation.alternatives}
                        onChange={(e) => handleAllocationChange('alternatives', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <div className="h-4 bg-blue-500" style={{ width: `${allocation.stocks}%` }}></div>
                    <div className="h-4 bg-green-500" style={{ width: `${allocation.bonds}%` }}></div>
                    <div className="h-4 bg-yellow-500" style={{ width: `${allocation.alternatives}%` }}></div>
                  </div>
                  <div className="flex text-xs mt-1">
                    <div className="text-blue-500" style={{ width: `${allocation.stocks}%` }}>Stocks</div>
                    <div className="text-green-500" style={{ width: `${allocation.bonds}%` }}>Bonds</div>
                    <div className="text-yellow-500" style={{ width: `${allocation.alternatives}%` }}>Alt</div>
                  </div>
                </div>
              )}
              
              {/* Always show a message about the next step */}
              <div className="mt-6 mb-4 text-sm text-gray-600">
                Click "Get AI Suggestions" to proceed with your selected optimization strategy
                {optimizationStrategy === 'risk_level' ? ` and risk level of ${riskLevel}` : ''}.
              </div>
              
              {/* Fixed footer with buttons */}
              <div className="mt-8 border-t pt-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleGetSuggestions}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    data-testid="get-ai-suggestions-button"
                  >
                    {loading ? 'Generating Suggestions...' : 'Get AI Suggestions'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && aiSuggestion && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">AI Portfolio Suggestion</h3>
                <p className="text-gray-600 mb-4">{aiSuggestion.analysis}</p>
                
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Expected Return:</span>
                    <span className="text-sm font-medium text-blue-700">{aiSuggestion.expected_return}</span>
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
                <h3 className="text-lg font-medium mb-3">Suggested Assets</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticker
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aiSuggestion.suggestions.map((asset: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {asset.ticker}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.allocation.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Fixed footer with buttons */}
              <div className="mt-8 border-t pt-4">
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreatePortfolio}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Creating Portfolio...' : 'Create Portfolio'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <AISettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default AIPortfolioModal;
