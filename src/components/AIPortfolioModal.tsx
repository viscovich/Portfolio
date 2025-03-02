import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { createAIPortfolio } from '../services/portfolioService';
import { getAIPortfolioSuggestion } from '../services/aiService';
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
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
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
    try {
      const suggestion = await getAIPortfolioSuggestion({
        stocks_percentage: allocation.stocks,
        bonds_percentage: allocation.bonds,
        alternatives_percentage: allocation.alternatives,
        risk_level: riskLevel
      });
      
      setAiSuggestion(suggestion);
      setStep(2);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
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
        risk_level: riskLevel
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
              <p className="text-gray-600 mb-6">
                Specify your target allocation and risk level, and our AI will suggest a portfolio tailored to your preferences.
              </p>
              
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
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Risk Level</h3>
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded-md ${riskLevel === 'low' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                    onClick={() => setRiskLevel('low')}
                  >
                    Low
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${riskLevel === 'medium' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                    onClick={() => setRiskLevel('medium')}
                  >
                    Medium
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${riskLevel === 'high' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                    onClick={() => setRiskLevel('high')}
                  >
                    High
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleGetSuggestions}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Generating Suggestions...' : 'Get AI Suggestions'}
                </button>
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
                    <span className="text-sm font-medium text-blue-700">{riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span>
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
