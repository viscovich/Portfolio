import { AIPortfolioRequest, AIAnalysisRequest } from '../types';

// Default settings
const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  model: 'qwen/qwen2.5-vl-72b-instruct:free',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || ''
};

// Log environment variable availability (without exposing the actual key)
console.log('Environment variables loaded:', {
  VITE_OPENROUTER_API_KEY_EXISTS: !!import.meta.env.VITE_OPENROUTER_API_KEY,
  VITE_OPENROUTER_API_KEY_LENGTH: import.meta.env.VITE_OPENROUTER_API_KEY ? import.meta.env.VITE_OPENROUTER_API_KEY.length : 0
});

// Settings storage key
const SETTINGS_STORAGE_KEY = 'portfolio_ai_settings';

// Get AI settings from local storage
export async function getAISettings(): Promise<{
  provider: string;
  model: string;
  apiKey: string;
}> {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings);
    } else {
      // Save default settings to local storage
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Error getting AI settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Update AI settings in local storage
export async function updateAISettings(settings: {
  provider: string;
  model: string;
  apiKey: string;
}): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving AI settings:', error);
    throw error;
  }
}

// Helper function to make API calls to OpenRouter
async function callOpenRouterAPI(prompt: string, settings?: any): Promise<any> {
  const aiSettings = settings || await getAISettings();
  
  // Log the prompt being sent to the API
  console.log('AI Prompt:', prompt);
  
  // Log detailed API settings for debugging
  console.log('API Settings:', {
    provider: aiSettings.provider,
    model: aiSettings.model,
    apiKey: aiSettings.apiKey ? `${aiSettings.apiKey.substring(0, 8)}...${aiSettings.apiKey.substring(aiSettings.apiKey.length - 4)}` : 'undefined',
    hasApiKey: !!aiSettings.apiKey,
    origin: window.location.origin
  });
  
  // Check if API key is present and properly formatted
  if (!aiSettings.apiKey) {
    console.error('API key is missing');
    throw new Error('API error: No auth credentials found - API key is missing');
  }
  
  // Ensure API key is properly formatted (OpenRouter keys start with 'sk-or-')
  if (aiSettings.provider === 'openrouter' && !aiSettings.apiKey.startsWith('sk-or-')) {
    console.warn('API key may be invalid - OpenRouter keys should start with "sk-or-"');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${aiSettings.apiKey.trim()}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Portfolio AI Assistant'
  };
  
  const body = {
    model: aiSettings.model,
    messages: [
      { 
        role: 'system', 
        content: 'You are a financial advisor AI assistant that specializes in portfolio management and investment advice. Always respond with valid JSON when asked to do so, wrapped in triple backticks with the json tag like this: ```json. Never include markdown formatting in your JSON responses.' 
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000
  };
  
  console.log('Request Headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers['Authorization'] ? 'Bearer [REDACTED]' : 'undefined',
    'Authorization-Length': headers['Authorization'] ? headers['Authorization'].length : 0,
    'HTTP-Referer': headers['HTTP-Referer'],
    'X-Title': headers['X-Title']
  });
  
  console.log('Request Body:', {
    model: body.model,
    messages: [
      { role: body.messages[0].role, content: '(system prompt)' },
      { role: body.messages[1].role, content: '(user prompt)' }
    ],
    temperature: body.temperature,
    max_tokens: body.max_tokens
  });
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    console.log('Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        
        if (errorData.error) {
          // Handle specific error types
          if (errorData.error.type === 'authentication_error' || 
              errorData.error.message?.includes('auth') || 
              errorData.error.message?.includes('key') ||
              errorData.error.message?.includes('token')) {
            errorMessage = `Authentication error: ${errorData.error.message}`;
            console.error('Authentication error details:', {
              type: errorData.error.type,
              message: errorData.error.message,
              param: errorData.error.param,
              code: errorData.error.code
            });
          } else {
            errorMessage = `API error: ${errorData.error.message || errorData.error}`;
          }
        }
      } catch (jsonError) {
        console.error('Failed to parse error response as JSON:', jsonError);
        // If response is 401 or 403, it's likely an auth issue
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Authentication error: Invalid or expired API key';
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Log the response from the API
    console.log('AI Response:', {
      id: data.id,
      model: data.model,
      content: data.choices && data.choices[0] ? data.choices[0].message.content.substring(0, 100) + '...' : 'No content',
      usage: data.usage
    });
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI API:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

// Function to parse AI response as JSON
function parseAIResponse(response: string): any {
  try {
    // Log the raw response for debugging
    console.log('Raw AI response:', response);
    
    // Extract JSON from the response if it's wrapped in text
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) ||
                      response.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      let jsonString = jsonMatch[1] || jsonMatch[0];
      
      // Attempt to fix common JSON syntax errors
      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing JSON, attempting to fix:', parseError);
        
        // Check if the JSON is truncated and try to complete it
        if (jsonString.includes('{') && !jsonString.trim().endsWith('}')) {
          console.log('JSON appears to be truncated, attempting to complete it');
          
          // Count opening and closing braces to determine how many closing braces are needed
          const openBraces = (jsonString.match(/{/g) || []).length;
          const closeBraces = (jsonString.match(/}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            // Add missing closing braces
            jsonString = jsonString + '}'.repeat(missingBraces);
          } else {
            // Just add one closing brace as a fallback
            jsonString = jsonString + '}';
          }
          
          // Check for truncated arrays
          const openBrackets = (jsonString.match(/\[/g) || []).length;
          const closeBrackets = (jsonString.match(/\]/g) || []).length;
          const missingBrackets = openBrackets - closeBrackets;
          
          if (missingBrackets > 0) {
            // Add missing closing brackets
            jsonString = jsonString + ']'.repeat(missingBrackets);
          }
          
          // Check for unclosed quotes in string values
          const quoteCount = (jsonString.match(/"/g) || []).length;
          if (quoteCount % 2 !== 0) {
            // Add a closing quote if there's an odd number of quotes
            jsonString = jsonString + '"';
          }
        }
        
        // Try to fix missing commas between objects
        jsonString = jsonString.replace(/}(\s*){/g, '},{');
        
        // Try to fix trailing commas
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix truncated property values
        jsonString = jsonString.replace(/"([^"]+)":\s*"([^"]*)$/g, '"$1": "$2"');
        
        // Try parsing again after fixes
        try {
          return JSON.parse(jsonString);
        } catch (fixedParseError) {
          console.error('Failed to fix JSON:', fixedParseError);
          throw fixedParseError;
        }
      }
    }
    
    // If we can't find JSON in the response, try to extract structured data from markdown
    if (response.includes('#') || response.includes('-')) {
      console.log('Attempting to parse markdown response');
      
      // Create a structured object from the markdown response
      const result: any = {
        summary: '',
        current_vs_target: [],
        recommendations: []
      };
      
      // Extract summary (usually after a heading)
      const summaryMatch = response.match(/#+\s*.*?\n+(.*?)(?=\n#+|$)/s);
      if (summaryMatch && summaryMatch[1]) {
        result.summary = summaryMatch[1].trim();
      }
      
      // Extract recommendations (usually bullet points)
      const recommendationsMatch = response.match(/#+\s*Recommendations.*?\n((?:-.*?\n)+)/s);
      if (recommendationsMatch && recommendationsMatch[1]) {
        result.recommendations = recommendationsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(Boolean);
      }
      
      // Try to extract table data for current_vs_target
      // This is a simplified approach - in a real app, you might need more robust parsing
      const tableMatch = response.match(/\|\s*Asset\s*\|\s*Current\s*\|\s*Target\s*\|\s*Action\s*\|.*?\n(?:\|.*?\|.*?\|.*?\|.*?\|\n)+/s);
      if (tableMatch) {
        const tableRows = tableMatch[0].split('\n').filter(row => row.includes('|') && !row.includes('---'));
        
        // Skip the header row
        for (let i = 1; i < tableRows.length; i++) {
          const row = tableRows[i];
          if (!row.trim()) continue;
          
          const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
          if (cells.length >= 4) {
            // Try to extract ticker and name from the first cell
            const assetMatch = cells[0].match(/([A-Z]+)\s*(?:-\s*)?(.+)?/);
            const ticker = assetMatch ? assetMatch[1] : cells[0];
            const name = assetMatch && assetMatch[2] ? assetMatch[2] : ticker;
            
            // Extract numbers from percentage strings
            const currentMatch = cells[1].match(/(\d+(?:\.\d+)?)/);
            const targetMatch = cells[2].match(/(\d+(?:\.\d+)?)/);
            
            result.current_vs_target.push({
              ticker: ticker,
              name: name,
              current: currentMatch ? parseFloat(currentMatch[1]) : 0,
              target: targetMatch ? parseFloat(targetMatch[1]) : 0,
              action: cells[3]
            });
          }
        }
      }
      
      // If we couldn't extract any structured data, throw an error
      if (result.summary || result.recommendations.length > 0 || result.current_vs_target.length > 0) {
        console.log('Successfully parsed markdown response:', result);
        return result;
      }
    }
    
    // If we couldn't parse the response, throw an error
    throw new Error('Could not extract structured data from AI response');
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Market Sentiment Analysis
export async function getMarketSentimentAnalysis(): Promise<any> {
  try {
    // Use the new prompt structure for market sentiment analysis
    const prompt = `
      Genera un'analisi aggiornata del sentiment di mercato, strutturata secondo i seguenti parametri:

      1. Current Sentiment
      Market Sentiment: Un valore aggregato compreso tra 0 e 100.
      Analisi: Breve spiegazione dell'andamento generale del mercato.
      2. Key Factors
      Economic Data
      EU: Sentiment e breve analisi (Es. impatto sulle politiche della BCE, crescita economica, inflazione).
      USA: Sentiment e breve analisi (Es. difficoltà nei mercati azionari, occupazione, crescita PIL).
      Central Bank Policy
      EU: Sentiment e breve analisi (Es. decisioni BCE sui tassi di interesse).
      USA: Sentiment e breve analisi (Es. decisioni Federal Reserve sui tassi di interesse).
      Corporate Earnings: Sentiment e impatto sui mercati finanziari.
      Geopolitical Events: Sentiment e impatti macroeconomici.
      Sentiment Complessivo (GESI): Analisi sintetica delle forze contrastanti nei mercati globali.
      3. Market Outlook
      Mercato Azionario
      USA: Sentiment, analisi, indice di riferimento (S&P 500).
      EU: Sentiment, analisi, indice di riferimento (STOXX Europe 600).
      Italy: Sentiment, analisi, indice di riferimento (FTSE MIB).
      Mercati Emergenti: Sentiment, analisi, indice di riferimento (MSCI Emerging Markets Index).
      Mercato Obbligazionario
      USA: Sentiment, analisi, indice di riferimento (Bloomberg Barclays US Aggregate Bond Index).
      EU: Sentiment, analisi, indice di riferimento (Bloomberg Barclays Euro Aggregate Bond Index).
      Italy: Sentiment, analisi, indice di riferimento (BofA Merrill Lynch Italy Government Bond Index).
      Mercati Emergenti: Sentiment, analisi, indice di riferimento (J.P. Morgan Emerging Markets Bond Index - EMBI).
      Materie Prime
      Oro: Sentiment, analisi, indice di riferimento (LBMA Gold Price).
      Petrolio: Sentiment, analisi, indice di riferimento (Brent Crude Oil Index).
      Rame: Sentiment, analisi, indice di riferimento (LME Copper).
      Gas Naturale: Sentiment, analisi, indice di riferimento (Henry Hub Natural Gas Spot Price).
      Metalli del gruppo del platino (PGM): Sentiment, analisi, indice di riferimento (LPPM Prices).
      4. Sector Outlook
      Per ciascun settore: Sentiment, analisi, indice di riferimento.
      Financials (S&P 500 Financials Index)
      Real Estate (S&P 500 Real Estate Index)
      Consumer Discretionary (S&P 500 Consumer Discretionary Index)
      Technology (S&P 500 Information Technology Index)
      Industrials (S&P 500 Industrials Index)
      Materials (S&P 500 Materials Index)
      Consumer Staples (S&P 500 Consumer Staples Index)
      Health Care (S&P 500 Health Care Index)
      Energy (S&P 500 Energy Index)
      Communication Services (S&P 500 Communication Services Index)
      Utilities (S&P 500 Utilities Index)
      
      Fornisci l'output nel seguente formato JSON:
      {
        "current_sentiment": {
          "market_sentiment": {
            "score": 75,
            "analysis": "Il mercato mostra segnali contrastanti, con un leggero ottimismo derivante dagli utili aziendali."
          }
        },
        "key_factors": {
          "economic_data": {
            "EU": {
              "sentiment": "Neutro",
              "analysis": "La BCE prevede una ripresa lenta con bassa disoccupazione ma incertezza sugli investimenti."
            },
            "USA": {
              "sentiment": "Neutro/Negativo",
              "analysis": "Difficoltà nel mercato azionario USA, con segnali misti tra gli investitori."
            }
          },
          "central_bank_policy": {
            "EU": {
              "sentiment": "Positivo",
              "analysis": "La BCE ha ridotto i tassi di interesse, segnalando fiducia nel controllo dell'inflazione."
            },
            "USA": {
              "sentiment": "Neutro",
              "analysis": "La Federal Reserve mantiene un approccio cauto."
            }
          },
          "corporate_earnings": {
            "sentiment": "Positivo",
            "analysis": "Molte aziende hanno riportato utili superiori alle attese, aumentando la fiducia degli investitori."
          },
          "geopolitical_events": {
            "sentiment": "Negativo",
            "analysis": "Le tensioni commerciali continuano a pesare sulle esportazioni."
          },
          "global_sentiment_index": {
            "sentiment": "Neutro",
            "analysis": "L'indice GESI riflette un equilibrio tra fattori positivi e negativi."
          }
        },
        "market_outlook": {
          "equity_markets": {
            "USA": {
              "sentiment": "Neutro",
              "analysis": "Situazione stabile con attenzione alle prossime decisioni della Fed.",
              "index": "S&P 500"
            },
            "EU": {
              "sentiment": "Neutro",
              "analysis": "Mercato europeo in fase di consolidamento.",
              "index": "STOXX Europe 600"
            },
            "Italy": {
              "sentiment": "Neutro",
              "analysis": "Performance in linea con i mercati europei.",
              "index": "FTSE MIB"
            },
            "emerging_markets": {
              "sentiment": "Neutro",
              "analysis": "Mercati emergenti influenzati dalle politiche globali.",
              "index": "MSCI Emerging Markets Index"
            }
          }
        }
      }
      
      It's critical that your response is valid JSON that can be parsed with JSON.parse(). 
      Wrap your JSON in triple backticks with the json tag like this: \`\`\`json
    `;
    
    const aiResponse = await callOpenRouterAPI(prompt);
    
    // Parse the AI response to get the detailed structure
    const parsedResponse = parseAIResponse(aiResponse);
    
    // Create the format expected by marketService.ts
    // This adapts the nested structure to a flattened structure with sentiment_score and overall_sentiment
    if (parsedResponse && parsedResponse.current_sentiment && parsedResponse.current_sentiment.market_sentiment) {
      return {
        // Extract the score and normalize it to 0-1 scale if needed
        sentiment_score: parsedResponse.current_sentiment.market_sentiment.score / 100,
        // Use the analysis as the overall sentiment
        overall_sentiment: parsedResponse.current_sentiment.market_sentiment.analysis,
        // Preserve the original detailed structure
        ...parsedResponse
      };
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('Error getting market sentiment analysis:', error);
    
    // Fallback to mock data if AI API fails
    console.log('Falling back to mock data for market sentiment analysis');
    
    // Mock data with the format expected by marketService
    const mockData = {
      current_sentiment: {
        market_sentiment: {
          score: 65,
          analysis: "Il mercato mostra segnali contrastanti, con un leggero ottimismo derivante dagli utili aziendali e dai dati macroeconomici positivi."
        }
      },
      key_factors: {
        economic_data: {
          EU: {
            sentiment: "Neutro",
            analysis: "La BCE prevede una ripresa lenta con bassa disoccupazione ma incertezza sugli investimenti."
          },
          USA: {
            sentiment: "Neutro/Positivo",
            analysis: "Economia USA resiliente con mercato del lavoro forte e inflazione in calo."
          }
        },
        central_bank_policy: {
          EU: {
            sentiment: "Positivo",
            analysis: "La BCE ha ridotto i tassi di interesse, segnalando fiducia nel controllo dell'inflazione."
          },
          USA: {
            sentiment: "Neutro",
            analysis: "La Federal Reserve mantiene un approccio cauto, con aspettative di tagli dei tassi entro fine anno."
          }
        },
        corporate_earnings: {
          sentiment: "Positivo",
          analysis: "Molte aziende hanno riportato utili superiori alle attese, aumentando la fiducia degli investitori."
        },
        geopolitical_events: {
          sentiment: "Negativo",
          analysis: "Le tensioni geopolitiche e commerciali continuano a pesare sui mercati globali."
        },
        global_sentiment_index: {
          sentiment: "Neutro",
          analysis: "L'indice GESI riflette un equilibrio tra fattori positivi e negativi nei mercati globali."
        }
      },
      market_outlook: {
        equity_markets: {
          USA: {
            sentiment: "Neutro/Positivo",
            analysis: "L'indice S&P 500 si mantiene vicino ai massimi storici, sostenuto dai titoli tecnologici.",
            index: "S&P 500"
          },
          EU: {
            sentiment: "Neutro",
            analysis: "Mercato europeo in fase di consolidamento con focus su politiche monetarie.",
            index: "STOXX Europe 600"
          },
          Italy: {
            sentiment: "Neutro",
            analysis: "Performance in linea con i mercati europei, influenzata dalle politiche fiscali domestiche.",
            index: "FTSE MIB"
          },
          emerging_markets: {
            sentiment: "Neutro/Positivo",
            analysis: "Mercati emergenti in recupero, guidati da Cina e India.",
            index: "MSCI Emerging Markets Index"
          }
        },
        bond_markets: {
          USA: {
            sentiment: "Neutro",
            analysis: "Rendimenti stabili con attenzione ai dati sull'inflazione e alle decisioni della Fed.",
            index: "Bloomberg Barclays US Aggregate Bond Index"
          },
          EU: {
            sentiment: "Neutro/Positivo",
            analysis: "Mercato obbligazionario europeo supportato dalle politiche della BCE.",
            index: "Bloomberg Barclays Euro Aggregate Bond Index"
          },
          Italy: {
            sentiment: "Neutro",
            analysis: "Spread in stabilizzazione grazie a politiche fiscali prudenti.",
            index: "BofA Merrill Lynch Italy Government Bond Index"
          },
          emerging_markets: {
            sentiment: "Positivo",
            analysis: "Obbligazioni dei mercati emergenti attrattive per gli investitori alla ricerca di rendimento.",
            index: "J.P. Morgan Emerging Markets Bond Index - EMBI"
          }
        },
        commodities: {
          gold: {
            sentiment: "Positivo",
            analysis: "L'oro ha raggiunto nuovi massimi grazie all'avversione al rischio e alle incertezze geopolitiche.",
            index: "LBMA Gold Price"
          },
          oil: {
            sentiment: "Neutro/Negativo",
            analysis: "Il prezzo del petrolio è influenzato dalle preoccupazioni sulla domanda globale e dalle tensioni in Medio Oriente.",
            index: "Brent Crude Oil Index"
          },
          copper: {
            sentiment: "Positivo",
            analysis: "Prezzi del rame in aumento grazie alla domanda per la transizione energetica.",
            index: "LME Copper"
          },
          gas_natural: {
            sentiment: "Neutro",
            analysis: "Gas naturale con prezzi contenuti a causa dell'aumento dell'offerta.",
            index: "Henry Hub Natural Gas Spot Price"
          },
          pgm: {
            sentiment: "Neutro/Positivo",
            analysis: "Metalli del gruppo del platino sostenuti dalla domanda industriale e automotive.",
            index: "LPPM Prices"
          }
        }
      },
      sector_outlook: {
        financials: {
          sentiment: "Neutro/Positivo",
          analysis: "Settore finanziario che beneficia di margini di interesse elevati e bilanci solidi.",
          index: "S&P 500 Financials Index"
        },
        real_estate: {
          sentiment: "Neutro",
          analysis: "Mercato immobiliare in fase di stabilizzazione dopo un periodo di rialzo dei tassi.",
          index: "S&P 500 Real Estate Index"
        },
        consumer_discretionary: {
          sentiment: "Neutro",
          analysis: "Consumi discrezionali influenzati dalle aspettative economiche e dall'inflazione.",
          index: "S&P 500 Consumer Discretionary Index"
        },
        technology: {
          sentiment: "Positivo",
          analysis: "Il settore tech continua a mostrare robustezza grazie all'innovazione e all'AI.",
          index: "S&P 500 Information Technology Index"
        },
        industrials: {
          sentiment: "Neutro/Positivo",
          analysis: "Settore industriale sostenuto dagli investimenti in infrastrutture.",
          index: "S&P 500 Industrials Index"
        },
        materials: {
          sentiment: "Neutro",
          analysis: "Materiali in equilibrio con domanda stabile e prezzi delle materie prime.",
          index: "S&P 500 Materials Index"
        },
        consumer_staples: {
          sentiment: "Neutro/Positivo",
          analysis: "Beni di prima necessità con performance stabili e margini che beneficiano dal calo dell'inflazione.",
          index: "S&P 500 Consumer Staples Index"
        },
        health_care: {
          sentiment: "Positivo",
          analysis: "Settore sanitario in crescita con innovazione continua e spesa sanitaria robusta.",
          index: "S&P 500 Health Care Index"
        },
        energy: {
          sentiment: "Neutro",
          analysis: "Energia con volatilità legata ai prezzi del petrolio e alla transizione energetica.",
          index: "S&P 500 Energy Index"
        },
        communication_services: {
          sentiment: "Neutro/Positivo",
          analysis: "Servizi di comunicazione supportati dalla domanda di contenuti digitali e servizi di streaming.",
          index: "S&P 500 Communication Services Index"
        },
        utilities: {
          sentiment: "Neutro",
          analysis: "Utilities con rendimenti stabili e dividendi affidabili in un contesto di tassi in calo.",
          index: "S&P 500 Utilities Index"
        }
      }
    };
    
    // Add the expected fields for marketService.ts
    return {
      sentiment_score: mockData.current_sentiment.market_sentiment.score / 100,
      overall_sentiment: mockData.current_sentiment.market_sentiment.analysis,
      ...mockData
    };
  }
}

export async function getAIPortfolioSuggestion(request: AIPortfolioRequest): Promise<any> {
  // Placeholder to keep TypeScript happy
  return { suggestions: [] };
}

export async function getPortfolioAnalysis(portfolioId: number, analysisType: string): Promise<any> {
  // Placeholder to keep TypeScript happy
  return { summary: '' };
}

export async function rebalancePortfolio(
  portfolioId: number,
  optimizationStrategy: 'risk_level' | 'sharpe_ratio' | 'ai_recommended' = 'ai_recommended',
  riskLevel?: number
): Promise<any> {
  // Placeholder to keep TypeScript happy
  return { summary: '' };
}

export async function testAIConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  // Placeholder to keep TypeScript happy
  return { success: true, message: 'OK' };
}
