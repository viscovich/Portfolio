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

import type { PortfolioAsset, PortfolioMetrics } from '../types'; // Import necessary types

export function calculatePortfolioMetrics(assets: PortfolioAsset[]): PortfolioMetrics {
  let calculated_return_1y = 0;
  let calculated_return_3y = 0;
  // For other metrics, we'll keep them random for now as discussed due to data limitations for accurate calculation.
  // True portfolio volatility and Sharpe ratio require covariance/correlation data not currently available.

  if (assets && assets.length > 0) {
    assets.forEach(pa => {
      if (pa.asset && pa.asset.metrics) {
        const allocationWeight = pa.allocation / 100;
        if (typeof pa.asset.metrics.return_1y === 'number') {
          calculated_return_1y += allocationWeight * pa.asset.metrics.return_1y;
        }
        if (typeof pa.asset.metrics.return_3y === 'number') {
          calculated_return_3y += allocationWeight * pa.asset.metrics.return_3y;
        }
        // Note: Weighted averages for dividend_yield and expense_ratio could be calculated here
        // if their individual asset metrics were consistently non-random.
        // Example: calculated_dividend_yield += allocationWeight * pa.asset.metrics.dividend_yield;
      }
    });
  }

  return {
    return_1y: parseFloat(calculated_return_1y.toFixed(2)),
    return_3y: parseFloat(calculated_return_3y.toFixed(2)),
    // Remaining metrics are placeholders/random as per current implementation
    volatility_3y: parseFloat((Math.random() * 15 + 5).toFixed(2)), // Placeholder
    sharpe_3y: parseFloat((Math.random() * 2 + 0.1).toFixed(2)),    // Placeholder
    dividend_yield: parseFloat((Math.random() * 5 + 1).toFixed(2)), // Placeholder
    expense_ratio: parseFloat((Math.random() * 1 + 0.1).toFixed(2)), // Placeholder
    risk_score: parseFloat((Math.random() * 10).toFixed(2)),         // Placeholder (DRC) - will be overridden by service if webhook provides value
    asset_count: assets.length,
    dr_optimized: undefined // Initialize as undefined, will be overridden by service if webhook provides value
  };
}
