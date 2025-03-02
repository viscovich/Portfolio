import React from 'react';
import { Link } from 'react-router-dom';
import { formatPercentage, getColorForPerformance } from '../lib/utils';
import { Asset } from '../types';
import { Eye, BarChart2, Plus } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
}

const AssetList: React.FC<AssetListProps> = ({ assets }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asset
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sector
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Return 1Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Return 3Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Volatility
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sharpe
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trend
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{asset.ticker}</div>
                    <div className="text-sm text-gray-500">{asset.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {asset.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {asset.sector || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {asset.region || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${getColorForPerformance(asset.metrics?.return_1y || 0)}`}>
                  {formatPercentage(asset.metrics?.return_1y || 0)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${getColorForPerformance(asset.metrics?.return_3y || 0)}`}>
                  {formatPercentage(asset.metrics?.return_3y || 0)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatPercentage(asset.metrics?.volatility_3y || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {asset.metrics?.sharpe_3y.toFixed(2) || '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-8 w-20">
                  <svg viewBox="0 0 100 30" className="h-full w-full">
                    <path
                      d={`M0,15 Q25,${Math.random() * 20} 50,${Math.random() * 20} T100,${Math.random() * 20}`}
                      fill="none"
                      stroke={asset.metrics?.return_3y > 0 ? "#10b981" : "#ef4444"}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900">
                    <Eye className="h-5 w-5" />
                  </Link>
                  <button className="text-blue-600 hover:text-blue-900">
                    <BarChart2 className="h-5 w-5" />
                  </button>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetList;