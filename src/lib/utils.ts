import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy');
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getColorForPerformance(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function getRandomChartData(length = 30, trend: 'up' | 'down' | 'volatile' = 'up'): { date: string; value: number }[] {
  const result = [];
  let value = 100;
  const today = new Date();
  
  for (let i = length - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate random movement based on trend
    let change;
    if (trend === 'up') {
      change = (Math.random() * 3) - 0.5; // Mostly positive
    } else if (trend === 'down') {
      change = (Math.random() * 3) - 2.5; // Mostly negative
    } else {
      change = (Math.random() * 6) - 3; // Volatile
    }
    
    value = Math.max(value + change, 10); // Ensure value doesn't go below 10
    
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      value: parseFloat(value.toFixed(2))
    });
  }
  
  return result;
}

export function calculatePortfolioMetrics(assets: any[]): any {
  // This would normally calculate actual metrics based on asset allocations
  // For demo purposes, we'll return mock data
  return {
    return_1y: parseFloat((Math.random() * 20 - 5).toFixed(2)),
    return_3y: parseFloat((Math.random() * 40 - 10).toFixed(2)),
    volatility_3y: parseFloat((Math.random() * 15 + 5).toFixed(2)),
    sharpe_3y: parseFloat((Math.random() * 2 + 0.1).toFixed(2)),
    dividend_yield: parseFloat((Math.random() * 5 + 1).toFixed(2)),
    expense_ratio: parseFloat((Math.random() * 1 + 0.1).toFixed(2)),
    risk_score: parseFloat((Math.random() * 10).toFixed(2)),
    asset_count: assets.length
  };
}