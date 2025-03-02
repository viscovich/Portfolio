import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketSentiment } from '../types';
import { formatDateShort } from '../lib/utils';

interface MarketSentimentCardProps {
  sentiment: MarketSentiment;
}

const MarketSentimentCard: React.FC<MarketSentimentCardProps> = ({ sentiment }) => {
  const getSentimentIcon = (score: number) => {
    if (score > 0.6) return <TrendingUp className="h-6 w-6 text-green-500" />;
    if (score < 0.4) return <TrendingDown className="h-6 w-6 text-red-500" />;
    return <Minus className="h-6 w-6 text-yellow-500" />;
  };
  
  const getSentimentText = (score: number) => {
    if (score > 0.7) return 'Very Positive';
    if (score > 0.6) return 'Positive';
    if (score > 0.4) return 'Neutral';
    if (score > 0.3) return 'Negative';
    return 'Very Negative';
  };
  
  const getSentimentColor = (score: number) => {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.6) return 'text-green-500';
    if (score > 0.4) return 'text-yellow-500';
    if (score > 0.3) return 'text-red-500';
    return 'text-red-600';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Market Sentiment</h3>
        <span className="text-sm text-gray-500">{formatDateShort(sentiment.date)}</span>
      </div>
      
      <div className="flex items-center mb-4">
        {getSentimentIcon(sentiment.sentiment_score)}
        <div className="ml-3">
          <span className={`text-lg font-medium ${getSentimentColor(sentiment.sentiment_score)}`}>
            {getSentimentText(sentiment.sentiment_score)}
          </span>
          <div className="text-sm text-gray-500">
            Score: {(sentiment.sentiment_score * 100).toFixed(0)}/100
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm">{sentiment.summary}</p>
    </div>
  );
};

export default MarketSentimentCard;