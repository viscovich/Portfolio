import React, { useState, useEffect } from 'react';
import { getMarketSentimentHistory } from '../services/marketService';
import { getMarketSentimentAnalysis } from '../services/aiService';
import { formatDateShort } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { MarketSentiment, DetailedMarketSentiment } from '../types';

const MarketSentimentPage: React.FC = () => {
  const [sentimentHistory, setSentimentHistory] = useState<MarketSentiment[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<DetailedMarketSentiment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSentiment, setSelectedSentiment] = useState<{
    date: string;
    score: number;
    hasDetailedData: boolean;
  } | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [historyData, analysisData] = await Promise.all([
          getMarketSentimentHistory(),
          getMarketSentimentAnalysis()
        ]);
        
        // Ensure consistency between sentiment history and AI analysis for today's date
        const today = new Date().toISOString().split('T')[0];
        const updatedHistoryData = historyData.map(item => {
          if (item.date.split('T')[0] === today && analysisData?.current_sentiment?.market_sentiment?.score) {
            // Convert score from 0-100 to 0-1 scale
            const sentimentScore = analysisData.current_sentiment.market_sentiment.score / 100;
            return {
              ...item,
              sentiment_score: sentimentScore
            };
          }
          return item;
        });
        
        setSentimentHistory(updatedHistoryData);
        setAiAnalysis(analysisData);
        
        // Set today's data as the default selected sentiment
        const todayData = updatedHistoryData.find(item => item.date.split('T')[0] === today);
        if (todayData) {
          setSelectedSentiment({
            date: todayData.date,
            score: todayData.sentiment_score,
            hasDetailedData: true
          });
        }
      } catch (error) {
        console.error('Error fetching market sentiment data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Market Sentiment</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Sentiment Trend</h2>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sentimentHistory.map(item => ({
                    date: formatDateShort(item.date),
                    score: item.sentiment_score * 100,
                    originalDate: item.date,
                    hasDetailedData: item.date.split('T')[0] === new Date().toISOString().split('T')[0]
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const payload = data.activePayload[0].payload;
                      setSelectedSentiment({
                        date: payload.originalDate,
                        score: payload.score / 100, // Convert back to 0-1 scale
                        hasDetailedData: payload.hasDetailedData
                      });
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(0)}%`, 'Sentiment Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Market Outlook</h2>
            
            {aiAnalysis && (
              <>
                <h3 className="text-md font-medium text-gray-900 mb-3">Key Markets</h3>
                <div className="space-y-3 mb-6">
                  {/* Equity Markets */}
                  {aiAnalysis.market_outlook.equity_markets && Object.entries(aiAnalysis.market_outlook.equity_markets).map(([key, market]) => (
                    <div key={`equity-${key}`} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{key === 'USA' ? 'US Stocks' : 
                                                              key === 'EU' ? 'European Stocks' : 
                                                              key === 'Italy' ? 'Italian Stocks' : 
                                                              'Emerging Markets'} ({market.index})</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        market.sentiment.includes('Positiv') ? 'bg-green-100 text-green-800' : 
                        market.sentiment.includes('Negativ') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {market.sentiment}
                      </span>
                    </div>
                  ))}
                  
                  {/* Bond Markets - Show just a few key ones */}
                  {aiAnalysis.market_outlook.bond_markets && (
                    <>
                      <div key="bond-US" className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">US Bonds ({aiAnalysis.market_outlook.bond_markets.USA.index})</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          aiAnalysis.market_outlook.bond_markets.USA.sentiment.includes('Positiv') ? 'bg-green-100 text-green-800' : 
                          aiAnalysis.market_outlook.bond_markets.USA.sentiment.includes('Negativ') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {aiAnalysis.market_outlook.bond_markets.USA.sentiment}
                        </span>
                      </div>
                      <div key="bond-EU" className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">EU Bonds ({aiAnalysis.market_outlook.bond_markets.EU.index})</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          aiAnalysis.market_outlook.bond_markets.EU.sentiment.includes('Positiv') ? 'bg-green-100 text-green-800' : 
                          aiAnalysis.market_outlook.bond_markets.EU.sentiment.includes('Negativ') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {aiAnalysis.market_outlook.bond_markets.EU.sentiment}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Commodities - Show just gold and oil */}
                  {aiAnalysis.market_outlook.commodities && (
                    <>
                      {(() => {
                        // Helper function to get commodity data regardless of language
                        const goldData = aiAnalysis.market_outlook.commodities.gold || 
                                     aiAnalysis.market_outlook.commodities.oro;
                        
                        const oilData = aiAnalysis.market_outlook.commodities.oil || 
                                    aiAnalysis.market_outlook.commodities.petrolio;
                        
                        return (
                          <>
                            {goldData && (
                              <div key="commodity-gold" className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">
                                  Gold ({goldData.index})
                                </span>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  goldData.sentiment.includes('Positiv') ? 'bg-green-100 text-green-800' : 
                                  goldData.sentiment.includes('Negativ') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {goldData.sentiment}
                                </span>
                              </div>
                            )}
                            
                            {oilData && (
                              <div key="commodity-oil" className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">
                                  Oil ({oilData.index})
                                </span>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  oilData.sentiment.includes('Positiv') ? 'bg-green-100 text-green-800' : 
                                  oilData.sentiment.includes('Negativ') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {oilData.sentiment}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
                
                <h3 className="text-md font-medium text-gray-900 mb-3">Sector Outlook</h3>
                <div className="space-y-3">
                  {/* List top sectors */}
                  {aiAnalysis.sector_outlook && Object.entries(aiAnalysis.sector_outlook)
                    .slice(0, 6) // Show top 6 sectors
                    .map(([key, sector]) => (
                      <div key={`sector-${key}`} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          sector.sentiment.includes('Positiv') ? 'bg-green-100 text-green-800' : 
                          sector.sentiment.includes('Negativ') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sector.sentiment}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedSentiment?.hasDetailedData ? 'Current Sentiment' : 'Historical Sentiment'}
              </h2>
              <span className="text-sm text-gray-500">
                {selectedSentiment ? formatDateShort(selectedSentiment.date) : formatDateShort(new Date().toISOString())}
              </span>
            </div>
            
            <div className="flex items-center mb-4">
              {selectedSentiment ? (
                selectedSentiment.score > 0.6 ? (
                  <TrendingUp className="h-10 w-10 text-green-500" />
                ) : selectedSentiment.score < 0.4 ? (
                  <TrendingDown className="h-10 w-10 text-red-500" />
                ) : (
                  <Minus className="h-10 w-10 text-yellow-500" />
                )
              ) : (aiAnalysis?.current_sentiment?.market_sentiment?.score ?? 0) > 60 ? (
                <TrendingUp className="h-10 w-10 text-green-500" />
              ) : (aiAnalysis?.current_sentiment?.market_sentiment?.score ?? 0) < 40 ? (
                <TrendingDown className="h-10 w-10 text-red-500" />
              ) : (
                <Minus className="h-10 w-10 text-yellow-500" />
              )}
              <div className="ml-4">
                {selectedSentiment?.hasDetailedData && aiAnalysis ? (
                  <div className="text-xl font-semibold text-gray-900">
                    {aiAnalysis.current_sentiment.market_sentiment.analysis.split('.')[0]}
                  </div>
                ) : (
                  <div className="text-xl font-semibold text-gray-900">
                    {selectedSentiment && selectedSentiment.score > 0.7 ? 'Very Positive' :
                     selectedSentiment && selectedSentiment.score > 0.6 ? 'Positive' :
                     selectedSentiment && selectedSentiment.score > 0.4 ? 'Neutral' :
                     selectedSentiment && selectedSentiment.score > 0.3 ? 'Negative' : 'Very Negative'}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Score: {selectedSentiment 
                          ? (selectedSentiment.score * 100).toFixed(0) 
                          : (aiAnalysis?.current_sentiment?.market_sentiment?.score ?? 0)}/100
                </div>
              </div>
            </div>
            
            {selectedSentiment?.hasDetailedData && aiAnalysis && (
              <div className="space-y-4 mt-6">
                <h3 className="text-md font-medium text-gray-900">Key Factors</h3>
                
                {/* Economic Data */}
                <div className="flex items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    aiAnalysis.key_factors.economic_data.USA.sentiment.includes('Positiv') ? 'bg-green-500' : 
                    aiAnalysis.key_factors.economic_data.USA.sentiment.includes('Negativ') ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">US Economy</div>
                    <div className="text-xs text-gray-500">{aiAnalysis.key_factors.economic_data.USA.analysis}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    aiAnalysis.key_factors.economic_data.EU.sentiment.includes('Positiv') ? 'bg-green-500' : 
                    aiAnalysis.key_factors.economic_data.EU.sentiment.includes('Negativ') ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">EU Economy</div>
                    <div className="text-xs text-gray-500">{aiAnalysis.key_factors.economic_data.EU.analysis}</div>
                  </div>
                </div>
                
                {/* Central Bank Policy */}
                <div className="flex items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    aiAnalysis.key_factors.central_bank_policy.USA.sentiment.includes('Positiv') ? 'bg-green-500' : 
                    aiAnalysis.key_factors.central_bank_policy.USA.sentiment.includes('Negativ') ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Fed Policy</div>
                    <div className="text-xs text-gray-500">{aiAnalysis.key_factors.central_bank_policy.USA.analysis}</div>
                  </div>
                </div>
                
                {/* Corporate Earnings */}
                <div className="flex items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    aiAnalysis.key_factors.corporate_earnings.sentiment.includes('Positiv') ? 'bg-green-500' : 
                    aiAnalysis.key_factors.corporate_earnings.sentiment.includes('Negativ') ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Corporate Earnings</div>
                    <div className="text-xs text-gray-500">{aiAnalysis.key_factors.corporate_earnings.analysis}</div>
                  </div>
                </div>
                
                {/* Geopolitical Events */}
                <div className="flex items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    aiAnalysis.key_factors.geopolitical_events.sentiment.includes('Positiv') ? 'bg-green-500' : 
                    aiAnalysis.key_factors.geopolitical_events.sentiment.includes('Negativ') ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Geopolitical Events</div>
                    <div className="text-xs text-gray-500">{aiAnalysis.key_factors.geopolitical_events.analysis}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentPage;
