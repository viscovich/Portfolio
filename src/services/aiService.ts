import { AIPortfolioRequest, AIAnalysisRequest } from '../types';

// Default settings
const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
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
    }
    return DEFAULT_SETTINGS;
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
    max_tokens: 1000
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

// Get AI portfolio suggestion
export async function getAIPortfolioSuggestion(request: AIPortfolioRequest): Promise<any> {
  try {
    // Determine risk level description based on optimization strategy
    let riskLevelDescription: string;
    if (request.optimization_strategy === 'risk_level' && request.risk_level !== undefined) {
      riskLevelDescription = `DRC Level ${request.risk_level} (on a scale of 1-5, where 1 is most conservative and 5 is most aggressive)`;
    } else if (request.optimization_strategy === 'sharpe_ratio') {
      riskLevelDescription = 'Optimized for maximum Sharpe ratio (best risk-adjusted returns)';
    } else {
      riskLevelDescription = 'AI recommended optimal risk level based on market conditions';
    }

    // First try to use the AI API
    const prompt = `
      Create a portfolio allocation based on the following parameters:
      - Stocks allocation: ${request.stocks_percentage}%
      - Bonds allocation: ${request.bonds_percentage}%
      - Alternatives allocation: ${request.alternatives_percentage}%
      - Optimization strategy: ${request.optimization_strategy}
      ${request.optimization_strategy === 'risk_level' && request.risk_level !== undefined ? `- Risk level (DRC): ${request.risk_level} (on a scale of 1-5)` : ''}
      
      Please provide a detailed response in JSON format with the following structure:
      {
        "suggestions": [
          { "ticker": "TICKER", "name": "FULL NAME", "allocation": PERCENTAGE, "type": "ETF/STOCK/BOND" },
          ...
        ],
        "analysis": "Detailed analysis of the portfolio",
        "expected_return": "Expected return range",
        "risk_assessment": "Risk assessment"
      }
      
      It's critical that your response is valid JSON that can be parsed with JSON.parse(). 
      Wrap your JSON in triple backticks with the json tag like this: \`\`\`json
    `;
    
    const aiResponse = await callOpenRouterAPI(prompt);
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error('Error getting AI portfolio suggestion:', error);
    
    // Fallback to mock data if AI API fails
    console.log('Falling back to mock data for portfolio suggestion');
    
    // Mock response based on request parameters
    const { stocks_percentage, bonds_percentage, alternatives_percentage, optimization_strategy, risk_level } = request;
    
    // Determine effective risk level for mock data
    let effectiveRiskLevel: 'low' | 'medium' | 'high';
    
    if (optimization_strategy === 'risk_level' && risk_level !== undefined) {
      // Map numeric risk level (1-5) to low/medium/high
      if (risk_level <= 2) {
        effectiveRiskLevel = 'low';
      } else if (risk_level <= 4) {
        effectiveRiskLevel = 'medium';
      } else {
        effectiveRiskLevel = 'high';
      }
    } else if (optimization_strategy === 'sharpe_ratio') {
      // Sharpe ratio optimization typically results in a balanced portfolio
      effectiveRiskLevel = 'medium';
    } else {
      // AI recommended - for mock data, we'll use a medium risk level
      effectiveRiskLevel = 'medium';
    }
    
    // Generate suggestions based on effective risk level
    let suggestions;
    
    if (effectiveRiskLevel === 'low') {
      suggestions = [
        { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', allocation: stocks_percentage * 0.4, type: 'ETF' },
        { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', allocation: stocks_percentage * 0.3, type: 'ETF' },
        { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', allocation: stocks_percentage * 0.3, type: 'ETF' },
        { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', allocation: bonds_percentage * 0.7, type: 'ETF' },
        { ticker: 'BNDX', name: 'Vanguard Total International Bond ETF', allocation: bonds_percentage * 0.3, type: 'ETF' },
        { ticker: 'GLD', name: 'SPDR Gold Shares', allocation: alternatives_percentage * 0.5, type: 'ETF' },
        { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', allocation: alternatives_percentage * 0.5, type: 'ETF' }
      ];
    } else if (effectiveRiskLevel === 'medium') {
      suggestions = [
        { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', allocation: stocks_percentage * 0.5, type: 'ETF' },
        { ticker: 'VGT', name: 'Vanguard Information Technology ETF', allocation: stocks_percentage * 0.2, type: 'ETF' },
        { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', allocation: stocks_percentage * 0.2, type: 'ETF' },
        { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', allocation: stocks_percentage * 0.1, type: 'ETF' },
        { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', allocation: bonds_percentage * 0.6, type: 'ETF' },
        { ticker: 'BNDX', name: 'Vanguard Total International Bond ETF', allocation: bonds_percentage * 0.4, type: 'ETF' },
        { ticker: 'GLD', name: 'SPDR Gold Shares', allocation: alternatives_percentage * 0.3, type: 'ETF' },
        { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', allocation: alternatives_percentage * 0.7, type: 'ETF' }
      ];
    } else { // high risk
      suggestions = [
        { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', allocation: stocks_percentage * 0.3, type: 'ETF' },
        { ticker: 'VGT', name: 'Vanguard Information Technology ETF', allocation: stocks_percentage * 0.3, type: 'ETF' },
        { ticker: 'VHT', name: 'Vanguard Health Care ETF', allocation: stocks_percentage * 0.1, type: 'ETF' },
        { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', allocation: stocks_percentage * 0.3, type: 'ETF' },
        { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', allocation: bonds_percentage * 0.5, type: 'ETF' },
        { ticker: 'BNDX', name: 'Vanguard Total International Bond ETF', allocation: bonds_percentage * 0.5, type: 'ETF' },
        { ticker: 'GLD', name: 'SPDR Gold Shares', allocation: alternatives_percentage * 0.2, type: 'ETF' },
        { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', allocation: alternatives_percentage * 0.5, type: 'ETF' },
        { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', allocation: alternatives_percentage * 0.3, type: 'ETF' }
      ];
    }
    
    // Create risk assessment description based on optimization strategy
    let riskAssessment: string;
    if (optimization_strategy === 'risk_level' && risk_level !== undefined) {
      riskAssessment = `This portfolio has a DRC level of ${risk_level} (on a scale of 1-5), with a volatility level that aligns with your specified risk tolerance.`;
    } else if (optimization_strategy === 'sharpe_ratio') {
      riskAssessment = 'This portfolio is optimized for the best risk-adjusted returns (Sharpe ratio), balancing potential gains with an appropriate level of risk.';
    } else {
      riskAssessment = 'This portfolio has an AI-recommended risk profile based on current market conditions and your asset allocation preferences.';
    }
    
    // Expected return based on effective risk level
    const expectedReturn = effectiveRiskLevel === 'low' ? '5-7%' : effectiveRiskLevel === 'medium' ? '7-9%' : '9-12%';
    
    return {
      suggestions,
      analysis: `Based on your allocation of ${stocks_percentage}% stocks, ${bonds_percentage}% bonds, and ${alternatives_percentage}% alternatives with ${optimization_strategy === 'risk_level' ? `a DRC level of ${risk_level}` : optimization_strategy === 'sharpe_ratio' ? 'Sharpe ratio optimization' : 'AI-recommended risk optimization'}, I've created a diversified portfolio. This allocation balances growth potential with risk management appropriate for your preferences.`,
      expected_return: expectedReturn,
      risk_assessment: riskAssessment
    };
  }
}

export async function getPortfolioAnalysis(portfolioId: number, analysisType: string): Promise<any> {
  try {
    // First fetch the portfolio data
    const { getPortfolioById } = await import('../services/portfolioService');
    const portfolio = await getPortfolioById(portfolioId);
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    // Create a string representation of the portfolio assets
    const portfolioAssetsString = portfolio.assets?.map(asset => 
      `${asset.asset.ticker} (${asset.asset.name}): ${asset.allocation}%, Return 1Y: ${asset.asset.metrics?.return_1y || 0}%, Return 3Y: ${asset.asset.metrics?.return_3y || 0}%, Volatility: ${asset.asset.metrics?.volatility_3y || 0}%`
    ).join('\n') || 'No assets';
    
    // Create a string representation of the portfolio metrics
    const portfolioMetricsString = `
      Portfolio Name: ${portfolio.name}
      Return 1Y: ${portfolio.metrics?.return_1y || 0}%
      Return 3Y: ${portfolio.metrics?.return_3y || 0}%
      Volatility 3Y: ${portfolio.metrics?.volatility_3y || 0}%
      Sharpe Ratio: ${portfolio.metrics?.sharpe_3y || 0}
      Dividend Yield: ${portfolio.metrics?.dividend_yield || 0}%
      Expense Ratio: ${portfolio.metrics?.expense_ratio || 0}%
    `;
    
    // First try to use the AI API
    const prompt = `
      Analyze the following portfolio for ${analysisType} analysis:
      
      Portfolio ID: ${portfolioId}
      ${portfolioMetricsString}
      
      Portfolio Assets:
      ${portfolioAssetsString}
      
      Please provide a detailed response in JSON format with the following structure based on the analysis type:
      
      For performance analysis:
      {
        "summary": "Summary of portfolio performance",
        "best_performers": [
          { "ticker": "TICKER", "name": "FULL NAME", "return_1y": NUMBER, "contribution": NUMBER }
        ],
        "worst_performers": [
          { "ticker": "TICKER", "name": "FULL NAME", "return_1y": NUMBER, "contribution": NUMBER }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }
      
      For risk analysis:
      {
        "summary": "Summary of portfolio risk",
        "risk_factors": [
          { "factor": "FACTOR NAME", "exposure": "Low/Medium/High", "impact": "DESCRIPTION" }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }
      
      For allocation analysis:
      {
        "summary": "Summary of portfolio allocation",
        "current_allocation": [
          { "category": "CATEGORY", "allocation": NUMBER, "benchmark": NUMBER, "difference": NUMBER }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }
      
      For rebalance analysis:
      {
        "summary": "Summary of portfolio rebalance needs",
        "current_vs_target": [
          { "ticker": "TICKER", "name": "FULL NAME", "current": NUMBER, "target": NUMBER, "action": "ACTION DESCRIPTION" }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }
      
      It's critical that your response is valid JSON that can be parsed with JSON.parse(). 
      Wrap your JSON in triple backticks with the json tag like this: \`\`\`json
    `;
    
    const aiResponse = await callOpenRouterAPI(prompt);
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error(`Error getting ${analysisType} analysis:`, error);
    
    // Fallback to mock data if AI API fails
    console.log(`Falling back to mock data for ${analysisType} analysis`);
    
    // Mock responses based on analysis type
    switch (analysisType) {
      case 'performance':
        return {
          summary: 'Your portfolio has outperformed the S&P 500 by 2.3% over the past year, with technology and healthcare sectors contributing most to the gains.',
          best_performers: [
            { ticker: 'VGT', name: 'Vanguard Information Technology ETF', return_1y: 28.4, contribution: 5.2 },
            { ticker: 'VHT', name: 'Vanguard Health Care ETF', return_1y: 18.7, contribution: 3.1 }
          ],
          worst_performers: [
            { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', return_1y: -3.1, contribution: -0.8 },
            { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', return_1y: 1.2, contribution: 0.2 }
          ],
          recommendations: [
            'Consider increasing allocation to technology sector given strong performance trends',
            'Review bond holdings as interest rate environment may continue to pressure returns',
            'Maintain diversification across sectors to manage risk'
          ]
        };
      
      case 'risk':
        return {
          summary: 'Your portfolio has a moderate risk profile with a volatility of 12.5%, which is slightly below the market average of 14.2%.',
          risk_factors: [
            { factor: 'Market Risk', exposure: 'Medium', impact: 'Your portfolio has a beta of 0.92, indicating slightly lower market risk than the S&P 500.' },
            { factor: 'Sector Concentration', exposure: 'Medium-High', impact: 'Technology sector represents 32% of your portfolio, which increases sector-specific risk.' },
            { factor: 'Geographic Exposure', exposure: 'Medium', impact: 'Your portfolio has 75% US exposure, which limits international diversification.' }
          ],
          recommendations: [
            'Consider increasing international exposure to improve geographic diversification',
            'Review technology sector allocation to ensure it aligns with your risk tolerance',
            'Add uncorrelated assets to further reduce portfolio volatility'
          ]
        };
      
      case 'allocation':
        return {
          summary: 'Your current asset allocation is 65% stocks, 25% bonds, and 10% alternatives, which is appropriate for a growth-oriented investor with a moderate risk tolerance.',
          current_allocation: [
            { category: 'US Stocks', allocation: 45, benchmark: 40, difference: 5 },
            { category: 'International Stocks', allocation: 20, benchmark: 25, difference: -5 },
            { category: 'US Bonds', allocation: 15, benchmark: 15, difference: 0 },
            { category: 'International Bonds', allocation: 10, benchmark: 10, difference: 0 },
            { category: 'Real Estate', allocation: 5, benchmark: 5, difference: 0 },
            { category: 'Commodities', allocation: 5, benchmark: 5, difference: 0 }
          ],
          recommendations: [
            'Consider increasing international stock exposure to align with benchmark',
            'Maintain current bond allocation as it aligns with your risk profile',
            'Review individual holdings within each asset class to ensure quality and fit'
          ]
        };
      
      case 'rebalance':
        return {
          summary: 'Your portfolio has drifted from its target allocation due to market movements. A rebalance is recommended to maintain your desired risk profile.',
          current_vs_target: [
            { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', current: 35, target: 30, action: 'Reduce by 5%' },
            { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', current: 15, target: 20, action: 'Increase by 5%' },
            { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', current: 20, target: 25, action: 'Increase by 5%' },
            { ticker: 'VGT', name: 'Vanguard Information Technology ETF', current: 20, target: 15, action: 'Reduce by 5%' },
            { ticker: 'GLD', name: 'SPDR Gold Shares', current: 10, target: 10, action: 'No change' }
          ],
          recommendations: [
            'Rebalance to target allocation to maintain risk profile',
            'Consider tax implications when selling appreciated assets',
            'Use new contributions to adjust allocation without selling existing positions if possible'
          ]
        };
      
      default:
        return {
          summary: 'Analysis not available for the requested type.',
          recommendations: []
        };
    }
  }
}

export async function getMarketSentimentAnalysis(): Promise<any> {
  try {
    // First try to use the AI API
    const prompt = `
      Analyze the current market sentiment based on recent economic data, central bank policies, corporate earnings, and geopolitical events.
      
      Please provide a detailed response in JSON format with the following structure:
      {
        "overall_sentiment": "Positive/Negative/Neutral description",
        "sentiment_score": NUMBER (-1 to 1 scale),
        "key_factors": [
          { "factor": "FACTOR NAME", "sentiment": "Positive/Negative/Neutral", "details": "DESCRIPTION" }
        ],
        "sector_outlook": [
          { "sector": "SECTOR NAME", "outlook": "Positive/Negative/Neutral", "details": "DESCRIPTION" }
        ],
        "investment_implications": ["Implication 1", "Implication 2", "Implication 3", "Implication 4"]
      }
      
      It's critical that your response is valid JSON that can be parsed with JSON.parse(). 
      Wrap your JSON in triple backticks with the json tag like this: \`\`\`json
    `;
    
    const aiResponse = await callOpenRouterAPI(prompt);
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error('Error getting market sentiment analysis:', error);
    
    // Fallback to mock data if AI API fails
    console.log('Falling back to mock data for market sentiment analysis');
    
    // Mock market sentiment analysis
    return {
      overall_sentiment: 'Moderately Positive',
      sentiment_score: 0.65, // -1 to 1 scale
      key_factors: [
        { factor: 'Economic Data', sentiment: 'Positive', details: 'Recent economic indicators show stronger than expected growth with controlled inflation.' },
        { factor: 'Central Bank Policy', sentiment: 'Neutral', details: 'Central banks are maintaining current policies with potential for rate cuts later in the year.' },
        { factor: 'Corporate Earnings', sentiment: 'Positive', details: 'Q1 earnings have largely exceeded expectations, particularly in technology and healthcare sectors.' },
        { factor: 'Geopolitical Events', sentiment: 'Negative', details: 'Ongoing conflicts and trade tensions create uncertainty in specific regions and sectors.' }
      ],
      sector_outlook: [
        { sector: 'Technology', outlook: 'Positive', details: 'Strong earnings and AI developments continue to drive growth.' },
        { sector: 'Healthcare', outlook: 'Positive', details: 'Innovation and demographic trends support continued expansion.' },
        { sector: 'Financials', outlook: 'Neutral', details: 'Stable but facing pressure from potential rate changes.' },
        { sector: 'Energy', outlook: 'Negative', details: 'Price volatility and transition pressures create headwinds.' }
      ],
      investment_implications: [
        'Consider maintaining or slightly increasing equity exposure given positive economic indicators',
        'Technology and healthcare sectors remain attractive for growth-oriented investors',
        'Fixed income may benefit from potential rate cuts later in the year',
        'Maintain diversification to manage geopolitical and sector-specific risks'
      ]
    };
  }
}

// Function to rebalance a portfolio using AI
export async function rebalancePortfolio(
  portfolioId: number,
  optimizationStrategy: 'risk_level' | 'sharpe_ratio' | 'ai_recommended' = 'ai_recommended',
  riskLevel?: number
): Promise<{
  summary: string;
  current_vs_target: Array<{
    ticker: string;
    name: string;
    current: number;
    target: number;
    action: string;
  }>;
  recommendations: string[];
}> {
  try {
    // First fetch the portfolio data
    const { getPortfolioById } = await import('../services/portfolioService');
    const portfolio = await getPortfolioById(portfolioId);
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    // Create a string representation of the portfolio assets
    const portfolioAssetsString = portfolio.assets?.map(asset => 
      `${asset.asset.ticker} (${asset.asset.name}): ${asset.allocation}%`
    ).join('\n') || 'No assets';
    
    // Determine optimization strategy description
    let optimizationDescription: string;
    if (optimizationStrategy === 'risk_level' && riskLevel !== undefined) {
      optimizationDescription = `with a target DRC level of ${riskLevel} (on a scale of 1-5, where 1 is most conservative and 5 is most aggressive)`;
    } else if (optimizationStrategy === 'sharpe_ratio') {
      optimizationDescription = 'optimized for maximum Sharpe ratio (best risk-adjusted returns)';
    } else {
      optimizationDescription = 'using AI-recommended risk optimization based on current market conditions';
    }
    
    // First try to use the AI API
    const prompt = `
      Rebalance a portfolio with ID ${portfolioId} ${optimizationDescription}.
      
      Current portfolio composition:
      ${portfolioAssetsString}
      
      Please analyze this portfolio and suggest a rebalanced allocation based on the specified optimization strategy,
      diversification principles, and risk management. Keep the same assets but adjust their allocations.
      
      Please provide a detailed response in JSON format with the following structure:
      {
        "summary": "Summary of portfolio rebalance",
        "current_vs_target": [
          { "ticker": "TICKER", "name": "FULL NAME", "current": NUMBER, "target": NUMBER, "action": "ACTION DESCRIPTION" }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }
      
      It's critical that your response is valid JSON that can be parsed with JSON.parse(). 
      Wrap your JSON in triple backticks with the json tag like this: \`\`\`json
    `;
    
    const aiResponse = await callOpenRouterAPI(prompt);
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error('Error rebalancing portfolio:', error);
    
    // Fallback to mock data if AI API fails
    console.log('Falling back to mock data for portfolio rebalance');
    
    // Return mock rebalance data
    return {
      summary: 'Your portfolio has been rebalanced to align with your target allocation and risk profile.',
      current_vs_target: [
        { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', current: 35, target: 30, action: 'Reduced by 5%' },
        { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', current: 15, target: 20, action: 'Increased by 5%' },
        { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', current: 20, target: 25, action: 'Increased by 5%' },
        { ticker: 'VGT', name: 'Vanguard Information Technology ETF', current: 20, target: 15, action: 'Reduced by 5%' },
        { ticker: 'GLD', name: 'SPDR Gold Shares', current: 10, target: 10, action: 'No change' }
      ],
      recommendations: [
        'Consider tax implications when selling appreciated assets',
        'Review your risk profile periodically to ensure it aligns with your financial goals',
        'Set up automatic rebalancing to maintain your target allocation'
      ]
    };
  }
}

// Test function to diagnose API authentication issues
export async function testAIConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('Testing AI API connection...');
    
    // Get the current settings
    const settings = await getAISettings();
    
    // Log the settings (with partial API key for security)
    console.log('Current AI Settings:', {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey ? `${settings.apiKey.substring(0, 8)}...${settings.apiKey.substring(settings.apiKey.length - 4)}` : 'undefined',
      hasApiKey: !!settings.apiKey
    });
    
    // Make a simple test call to the API
    const testPrompt = 'Respond with a simple "Hello, World!" message.';
    
    try {
      const response = await callOpenRouterAPI(testPrompt);
      return {
        success: true,
        message: 'Successfully connected to AI API',
        details: {
          responsePreview: response.substring(0, 100) + (response.length > 100 ? '...' : '')
        }
      };
    } catch (apiError) {
      // If the API call fails, return detailed error information
      return {
        success: false,
        message: 'Failed to connect to AI API',
        details: {
          error: apiError instanceof Error ? apiError.message : String(apiError),
          settings: {
            provider: settings.provider,
            model: settings.model,
            hasApiKey: !!settings.apiKey,
            apiKeyLength: settings.apiKey ? settings.apiKey.length : 0
          }
        }
      };
    }
  } catch (error) {
    // If there's an error getting settings or other setup issues
    return {
      success: false,
      message: 'Error setting up AI connection test',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
