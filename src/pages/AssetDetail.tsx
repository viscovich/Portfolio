import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Download } from 'lucide-react';
import { getAssetById } from '../services/portfolioService';
import { formatPercentage, formatCurrency, getColorForPerformance } from '../lib/utils';
import PortfolioChart from '../components/PortfolioChart';
import type { Asset } from '../types';

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getAssetById(parseInt(id));
        setAsset(data);
      } catch (error) {
        console.error('Error fetching asset:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAsset();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!asset) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Asset not found.</p>
        <Link to="/assets" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Assets
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/assets" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.ticker}</h1>
            <p className="text-gray-500">{asset.name}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Add to Portfolio
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Asset Overview</h2>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {asset.type}
              </span>
              {asset.sector && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {asset.sector}
                </span>
              )}
              {asset.region && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {asset.region}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {asset.metrics?.chart_data && (
                <PortfolioChart data={asset.metrics.chart_data} />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Current Price</div>
                <div className="text-xl font-semibold text-gray-900">
                  ${formatCurrency(asset.metrics?.price || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Return 1Y</div>
                <div className={`text-xl font-semibold ${getColorForPerformance(asset.metrics?.return_1y || 0)}`}>
                  {formatPercentage(asset.metrics?.return_1y || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Return 3Y</div>
                <div className={`text-xl font-semibold ${getColorForPerformance(asset.metrics?.return_3y || 0)}`}>
                  {formatPercentage(asset.metrics?.return_3y || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Volatility 3Y</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatPercentage(asset.metrics?.volatility_3y || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Sharpe Ratio</div>
                <div className="text-xl font-semibold text-gray-900">
                  {asset.metrics?.sharpe_3y.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Dividend Yield</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatPercentage(asset.metrics?.dividend_yield || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Expense Ratio</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatPercentage(asset.metrics?.expense_ratio || 0)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Risk Score</div>
                <div className="text-xl font-semibold text-gray-900">
                  {asset.metrics?.risk_score.toFixed(1) || '0.0'}/10
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Asset Description</h2>
          <p className="text-gray-600 mb-6">
            {asset.description || `${asset.name} (${asset.ticker}) is a ${asset.type.toLowerCase()} that provides exposure to ${asset.sector || 'various sectors'} in the ${asset.region || 'global'} market.`}
          </p>
          
          <div className="flex justify-end">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center">
              <Download className="h-5 w-5 mr-1" />
              Download Fact Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;