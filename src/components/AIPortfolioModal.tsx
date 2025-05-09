import React, { useState } from 'react';
import { X, Settings, Sliders, TrendingUp, Sparkles } from 'lucide-react';
import { createAIPortfolio } from '../services/portfolioService';
import { getAIPortfolioSuggestion, testAIConnection } from '../services/aiService';
import AISettingsModal from './AISettingsModal';

interface ImageDataRow { // For the static image data
  isin: string;
  return1y: string;
  return3y: string;
  volatility: string;
  trend: string;
}

// Combined interface for what will be stored in aiSuggestion.suggestions
interface CombinedAssetData {
  isin: string;
  return1y: string;
  return3y: string;
  volatility: string;
  trend: string;
  allocation?: number; // From webhook or AI
  name?: string;       // From AI, or default
  type?: string;       // From AI, or default
}

const imageData: ImageDataRow[] = [
  { isin: 'IE00B643RZ01', return1y: '-5.81%', return3y: '10.26%', volatility: '10.56%', trend: 'down' },
  { isin: 'LU1686830909', return1y: '3.28%', return3y: '-6.64%', volatility: '6.90%', trend: 'up' },
  { isin: 'DE000ETF7011', return1y: '6.07%', return3y: '10.00%', volatility: '9.29%', trend: 'up' },
  { isin: 'LU1829220216', return1y: '7.05%', return3y: '25.36%', volatility: '13.86%', trend: 'up' },
  { isin: 'LU1287023003', return1y: '2.62%', return3y: '-2.47%', volatility: '6.13%', trend: 'up' },
  { isin: 'LU1190417599', return1y: '3.76%', return3y: '8.49%', volatility: '0.45%', trend: 'up' },
  { isin: 'IE000JBB8CR7', return1y: '4.42%', return3y: '3.69%', volatility: '6.16%', trend: 'up' },
  { isin: 'FR0010429068', return1y: '7.96%', return3y: '6.17%', volatility: '13.61%', trend: 'up' },
  { isin: 'LU1215415214', return1y: '5.99%', return3y: '10.54%', volatility: '7.17%', trend: 'up' },
  { isin: 'IE000E66LX20', return1y: '2.32%', return3y: '29.37%', volatility: '16.19%', trend: 'up' },
  { isin: 'LU1650491282', return1y: '-0.13%', return3y: '-6.51%', volatility: '8.35%', trend: 'down' },
];

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
    setAiSuggestion(null);

    try {
      let rawSuggestionsFromSource: Array<{ ticker: string; name?: string; type?: string; allocation: number }> = [];
      let analysisText = '';
      let expectedReturn = 'N/A';
      let drOptimizedStr = ''; // Store as string from webhook
      let drcFinalStr = '';    // Store as string from webhook

      if (optimizationStrategy === 'risk_level') {
        const response = await fetch(`https://viscovich.duckdns.org/webhook/drc?profile=${riskLevel}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data && data.output) {
          const lines = data.output.split('\n');
          const assetRegex = /^([A-Z0-9]+):\s*([\d.]+)\s*%/;
          const drOptimizedRegex = /DR\s+ottimizzato\s*:\s*([\d.]+)/;
          const drcFinalRegex = /DRC\s+finale\s*:\s*([\d.]+)/;

          lines.forEach((line: string) => {
            const assetMatch = line.match(assetRegex);
            if (assetMatch) {
              const allocationVal = parseFloat(assetMatch[2]);
              if (allocationVal > 0) {
                rawSuggestionsFromSource.push({
                  ticker: assetMatch[1], // This is the ISIN
                  allocation: allocationVal,
                  name: 'N/A', 
                  type: 'N/A',
                });
              }
            }
            const drOptMatch = line.match(drOptimizedRegex);
            if (drOptMatch) drOptimizedStr = drOptMatch[1]; // Store the string value
            const drcFinalMatch = line.match(drcFinalRegex);
            if (drcFinalMatch) drcFinalStr = drcFinalMatch[1]; // Store the string value
          });
          
          analysisText = `Portfolio generated based on DRC Profile ${riskLevel}.`;
          if (drOptimizedStr) analysisText += ` Optimized DR: ${drOptimizedStr}.`;
          if (drcFinalStr) analysisText += ` Final DRC: ${drcFinalStr}.`;
          // expected_return remains 'N/A' for this path
        } else {
          throw new Error('Invalid data format from DRC API');
        }
      } else { // 'sharpe_ratio' or 'ai_recommended'
        const suggestionFromAI = await getAIPortfolioSuggestion({
          stocks_percentage: allocation.stocks,
          bonds_percentage: allocation.bonds,
          alternatives_percentage: allocation.alternatives,
          optimization_strategy: optimizationStrategy,
        });
        rawSuggestionsFromSource = suggestionFromAI.suggestions || [];
        analysisText = suggestionFromAI.analysis || 'AI Recommended Portfolio.';
        expectedReturn = suggestionFromAI.expected_return || 'N/A';
      }

      // Merge rawSuggestionsFromSource with imageData
      const mergedSuggestions: CombinedAssetData[] = rawSuggestionsFromSource.map(rawAsset => {
        const imageAsset = imageData.find(img => img.isin === rawAsset.ticker);
        if (imageAsset) {
          return {
            ...imageAsset, // isin, return1y, return3y, volatility, trend
            allocation: rawAsset.allocation,
            name: rawAsset.name || imageAsset.isin,
            type: rawAsset.type || 'N/A',
          };
        }
        // If no match in imageData, still include the asset from AI/webhook
        return {
          isin: rawAsset.ticker,
          return1y: 'N/A',
          return3y: 'N/A',
          volatility: 'N/A',
          trend: 'N/A',
          allocation: rawAsset.allocation,
          name: rawAsset.name || rawAsset.ticker,
          type: rawAsset.type || 'N/A',
        };
      });

      setAiSuggestion({
        analysis: analysisText,
        expected_return: expectedReturn,
        suggestions: mergedSuggestions,
        drOptimizedStr: drOptimizedStr, // Store DR string in state
        drcFinalStr: drcFinalStr       // Store DRC string in state
      });
      setStep(2);

    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      const fallbackSuggestions: CombinedAssetData[] = imageData.map(imgAsset => ({
        ...imgAsset,
        allocation: undefined,
        name: imgAsset.isin,
        type: 'N/A',
      }));
      setAiSuggestion({ 
        analysis: `Error fetching suggestions: ${error instanceof Error ? error.message : String(error)}`, 
        expected_return: 'N/A', 
        suggestions: fallbackSuggestions,
      });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePortfolio = async () => {
    setLoading(true);
    try {
      const assetsToSubmit = aiSuggestion?.suggestions?.map((s: CombinedAssetData) => ({
        ticker: s.isin, 
        name: s.name && s.name !== 'N/A' ? s.name : s.isin, 
        type: s.type && s.type !== 'N/A' ? s.type : 'Unknown', 
        allocation: s.allocation || 0,
        return1y_img: s.return1y, // Pass along the string metric from imageData
        return3y_img: s.return3y,   // Pass along the string metric from imageData
        volatility_img: s.volatility // Pass along the string metric from imageData
      }));

      await createAIPortfolio({
        stocks_percentage: allocation.stocks,
        bonds_percentage: allocation.bonds,
        alternatives_percentage: allocation.alternatives,
        optimization_strategy: optimizationStrategy,
        risk_level: optimizationStrategy === 'risk_level' ? riskLevel : undefined,
        dr_optimized_str: aiSuggestion?.drOptimizedStr, // Pass DR string
        drc_final_str: aiSuggestion?.drcFinalStr,       // Pass DRC string
        suggested_assets: assetsToSubmit
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
                          ISIN
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
                      {aiSuggestion.suggestions.map((asset: CombinedAssetData, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {asset.isin}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof asset.allocation === 'number' ? `${asset.allocation.toFixed(1)}%` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.return1y}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.return3y}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.volatility}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.trend}
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
