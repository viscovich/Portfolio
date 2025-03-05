import { MarketSentiment } from '../types';
import { getMarketSentimentAnalysis } from './aiService';

// Mock market sentiment data for fallback
const mockMarketSentiment: MarketSentiment[] = [
  {
    id: 1,
    date: new Date().toISOString(),
    sentiment_score: 0.7,
    summary: 'Markets are showing positive momentum with technology and healthcare sectors leading the gains. Inflation concerns are subsiding, and central banks are expected to maintain current interest rates.',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    sentiment_score: 0.3,
    summary: 'Markets experienced volatility due to mixed economic data. Consumer discretionary and energy sectors underperformed, while defensive sectors showed resilience.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    sentiment_score: 0.5,
    summary: 'Markets closed flat as investors await key economic reports. International markets outperformed domestic ones, with emerging markets showing strength.',
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 4,
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    sentiment_score: 0.6,
    summary: 'Markets rallied on positive earnings reports from major tech companies. The Fed signaled a potential rate cut later this year, boosting investor confidence.',
    created_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 5,
    date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    sentiment_score: 0.4,
    summary: 'Markets traded sideways as investors digested mixed economic signals. Manufacturing data showed improvement while consumer confidence declined slightly.',
    created_at: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: 6,
    date: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    sentiment_score: 0.55,
    summary: 'Markets showed modest gains led by financial and industrial sectors. Global trade tensions eased following positive diplomatic developments.',
    created_at: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: 7,
    date: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    sentiment_score: 0.65,
    summary: 'Markets advanced broadly with all major sectors in positive territory. Economic data points to continued growth with inflation remaining within target ranges.',
    created_at: new Date(Date.now() - 518400000).toISOString()
  }
];

export async function getMarketSentiment(): Promise<MarketSentiment> {
  try {
    // First try to get real data from OpenRouter via aiService
    try {
      console.log('Attempting to get market sentiment from OpenRouter...');
      const aiAnalysis = await getMarketSentimentAnalysis();
      
      if (aiAnalysis && aiAnalysis.sentiment_score !== undefined) {
        console.log('Successfully retrieved market sentiment from OpenRouter');
        
        // Convert AI analysis to MarketSentiment format
        return {
          id: 1,
          date: new Date().toISOString(),
          sentiment_score: aiAnalysis.sentiment_score,
          summary: aiAnalysis.overall_sentiment,
          created_at: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response format from OpenRouter');
      }
    } catch (apiError) {
      console.error('Error getting market sentiment from OpenRouter, falling back to mock data:', apiError);
      
      // Fallback to mock data
      return mockMarketSentiment[0];
    }
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    throw error;
  }
}

export async function getMarketSentimentHistory(days: number = 7): Promise<MarketSentiment[]> {
  try {
    // First try to get current sentiment from OpenRouter
    try {
      console.log('Attempting to get current market sentiment from OpenRouter for history...');
      const currentSentiment = await getMarketSentiment();
      
      if (currentSentiment) {
        console.log('Successfully retrieved current market sentiment for history');
        
        // Create a history array with the current sentiment and historical mock data
        // This simulates having real current data with historical data
        const mockHistory = [...mockMarketSentiment].slice(1, days);
        
        // Replace the first item with the real current sentiment
        const history = [currentSentiment, ...mockHistory];
        
        // Return in ascending date order (oldest first)
        return [...history].reverse();
      } else {
        throw new Error('Failed to get current market sentiment');
      }
    } catch (apiError) {
      console.error('Error getting market sentiment history from OpenRouter, falling back to mock data:', apiError);
      
      // Fallback to mock data
      return [...mockMarketSentiment].reverse();
    }
  } catch (error) {
    console.error('Error fetching market sentiment history:', error);
    return [];
  }
}
