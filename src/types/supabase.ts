export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: number
          created_at: string
          name: string
          user_id: string
          description: string | null
          is_ai_generated: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          user_id: string
          description?: string | null
          is_ai_generated?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          user_id?: string
          description?: string | null
          is_ai_generated?: boolean
        }
      }
      portfolio_assets: {
        Row: {
          id: number
          portfolio_id: number
          asset_id: number
          allocation: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          portfolio_id: number
          asset_id: number
          allocation: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          portfolio_id?: number
          asset_id?: number
          allocation?: number
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: number
          ticker: string
          name: string
          type: string
          created_at: string
          description: string | null
          sector: string | null
          region: string | null
        }
        Insert: {
          id?: number
          ticker: string
          name: string
          type: string
          created_at?: string
          description?: string | null
          sector?: string | null
          region?: string | null
        }
        Update: {
          id?: number
          ticker?: string
          name?: string
          type?: string
          created_at?: string
          description?: string | null
          sector?: string | null
          region?: string | null
        }
      }
      asset_metrics: {
        Row: {
          id: number
          asset_id: number
          date: string
          price: number
          return_1y: number
          return_3y: number
          volatility_3y: number
          sharpe_3y: number
          dividend_yield: number
          expense_ratio: number
          risk_score: number
        }
        Insert: {
          id?: number
          asset_id: number
          date: string
          price: number
          return_1y: number
          return_3y: number
          volatility_3y: number
          sharpe_3y: number
          dividend_yield: number
          expense_ratio: number
          risk_score: number
        }
        Update: {
          id?: number
          asset_id?: number
          date?: string
          price?: number
          return_1y?: number
          return_3y?: number
          volatility_3y?: number
          sharpe_3y?: number
          dividend_yield?: number
          expense_ratio?: number
          risk_score?: number
        }
      }
      market_sentiment: {
        Row: {
          id: number
          date: string
          sentiment_score: number
          summary: string
          created_at: string
        }
        Insert: {
          id?: number
          date: string
          sentiment_score: number
          summary: string
          created_at?: string
        }
        Update: {
          id?: number
          date?: string
          sentiment_score?: number
          summary?: string
          created_at?: string
        }
      }
    }
  }
}