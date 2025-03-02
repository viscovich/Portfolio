import React, { useState, useEffect } from 'react';
import { Plus, PlusCircle } from 'lucide-react';
import PortfolioList from '../components/PortfolioList';
import MarketSentimentCard from '../components/MarketSentimentCard';
import AIPortfolioModal from '../components/AIPortfolioModal';
import { getPortfolios } from '../services/portfolioService';
import { getMarketSentiment } from '../services/marketService';
import type { Portfolio, MarketSentiment } from '../types';

const Dashboard: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [portfoliosData, sentimentData] = await Promise.all([
          getPortfolios(),
          getMarketSentiment()
        ]);
        
        setPortfolios(portfoliosData);
        setMarketSentiment(sentimentData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handlePortfolioCreated = async () => {
    try {
      const updatedPortfolios = await getPortfolios();
      setPortfolios(updatedPortfolios);
    } catch (error) {
      console.error('Error refreshing portfolios:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Add Portfolio
          </button>
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-1" />
            AI Portfolio
          </button>
        </div>
      </div>
      
      {marketSentiment && (
        <MarketSentimentCard sentiment={marketSentiment} />
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Portfolios</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : portfolios.length > 0 ? (
          <PortfolioList portfolios={portfolios} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No portfolios found. Create your first portfolio to get started.</p>
            <div className="mt-4 flex justify-center space-x-4">
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Add Portfolio
              </button>
              <button 
                onClick={() => setIsAIModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                AI Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
      
      <AIPortfolioModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onSuccess={handlePortfolioCreated}
      />
    </div>
  );
};

export default Dashboard;