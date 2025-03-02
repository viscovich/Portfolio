import { MarketSentiment } from '../types';

// Mock market sentiment data
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
  }
];

export async function getMarketSentiment(): Promise<MarketSentiment> {
  try {
    // In a real app, this would fetch from Supabase or an API
    // const { data, error } = await supabase
    //   .from('market_sentiment')
    //   .select('*')
    //   .order('date', { ascending: false })
    //   .limit(1)
    //   .single();
    
    // if (error) throw error;
    // return data;
    
    return mockMarketSentiment[0];
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    throw error;
  }
}

export async function getMarketSentimentHistory(days: number = 7): Promise<MarketSentiment[]> {
  try {
    // In a real app, this would fetch from Supabase or an API
    // const { data, error } = await supabase
    //   .from('market_sentiment')
    //   .select('*')
    //   .order('date', { ascending: true })
    //   .limit(days);
    
    // if (error) throw error;
    // return data;
    
    // Return a copy of the array in ascending date order (oldest first)
    return [...mockMarketSentiment].reverse();
  } catch (error) {
    console.error('Error fetching market sentiment history:', error);
    return [];
  }
}

export async function getMarketNews(): Promise<any[]> {
  // This would normally fetch from a financial news API
  return [
    {
      id: 1,
      title: 'Fed Signals Potential Rate Cut in Coming Months',
      source: 'Financial Times',
      url: '#',
      date: new Date().toISOString(),
      sentiment: 'positive'
    },
    {
      id: 2,
      title: 'Tech Stocks Rally on Strong Earnings Reports',
      source: 'Wall Street Journal',
      url: '#',
      date: new Date().toISOString(),
      sentiment: 'positive'
    },
    {
      id: 3,
      title: 'Oil Prices Drop Amid Supply Concerns',
      source: 'Bloomberg',
      url: '#',
      date: new Date().toISOString(),
      sentiment: 'negative'
    },
    {
      id: 4,
      title: 'European Markets Close Higher on Economic Data',
      source: 'Reuters',
      url: '#',
      date: new Date().toISOString(),
      sentiment: 'positive'
    }
  ];
}
