import React, { useState, useEffect } from 'react';
import { getMarketSentimentHistory, getMarketNews } from '../services/marketService';
import { getMarketSentimentAnalysis } from '../services/aiService';
import { formatDateShort } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Newspaper, AlertCircle } from 'lucide-react';
import type { MarketSentiment } from '../types';

const MarketSentimentPage: React.FC = () => {
  const [sentimentHistory, setSentimentHistory] = useState<MarketSentiment[]>([]);
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [historyData, newsData, analysisData] = await Promise.all([
          getMarketSentimentHistory(),
          getMarketNews(),
          getMarketSentimentAnalysis()
        ]);
        
        setSentimentHistory(historyData);
        setMarketNews(newsData);
        setAiAnalysis(analysisData);
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
                    score: item.sentiment_score * 100
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Current Sentiment</h2>
              <span className="text-sm text-gray-500">{formatDateShort(new Date().toISOString())}</span>
            </div>
            
            <div className="flex items-center mb-4">
              {aiAnalysis.sentiment_score > 0.6 ? (
                <TrendingUp className="h-10 w-10 text-green-500" />
              ) : aiAnalysis.sentiment_score < 0.4 ? (
                <TrendingDown className="h-10 w-10 text-red-500" />
              ) : (
                <Minus className="h-10 w-10 text-yellow-500" />
              )}
              <div className="ml-4">
                <div className="text-xl font-semibold text-gray-900">{aiAnalysis.overall_sentiment}</div>
                <div className="text-sm text-gray-500">
                  Score: {(aiAnalysis.sentiment_score * 100).toFixed(0)}/100
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="text-md font-medium text-gray-900">Key Factors</h3>
              {aiAnalysis.key_factors.map((factor: any, index: number) => (
                <div key={index} className="flex items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    factor.sentiment === 'Positive' ? 'bg-green-500' : 
                    factor.sentiment === 'Negative' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{factor.factor}</div>
                    <div className="text-xs text-gray-500">{factor.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Market News</h2>
            
            <div className="space-y-4">
              {marketNews.map((news) => (
                <div key={news.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start">
                    <div className={`mt-1 h-3 w-3 rounded-full ${
                      news.sentiment === 'positive' ? 'bg-green-500' : 
                      news.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="ml-3">
                      <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-md font-medium text-blue-600 hover:text-blue-800">
                        {news.title}
                      </a>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Newspaper className="h-3 w-3 mr-1" />
                        <span>{news.source}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDateShort(news.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Investment Implications</h2>
            
            <div className="space-y-3">
              {aiAnalysis.investment_implications.map((implication: string, index: number) => (
                <div key={index} className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-2 text-sm text-gray-600">{implication}</p>
                </div>
              ))}
            </div>
            
            <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Sector Outlook</h3>
            <div className="space-y-3">
              {aiAnalysis.sector_outlook.map((sector: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{sector.sector}</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    sector.outlook === 'Positive' ? 'bg-green-100 text-green-800' : 
                    sector.outlook === 'Negative' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sector.outlook}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentPage;