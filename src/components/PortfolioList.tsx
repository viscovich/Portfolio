import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateShort, formatPercentage, getColorForPerformance } from '../lib/utils';
import { Portfolio } from '../types';
import { Eye } from 'lucide-react';

interface PortfolioListProps {
  portfolios: Portfolio[];
}

const PortfolioList: React.FC<PortfolioListProps> = ({ portfolios }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Portfolio
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asset #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rend. 3Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vol. 3Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sharpe 3Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trend 3Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DR 1Y
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DR 6M
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prob.
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DRC
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {portfolios.map((portfolio) => (
            <tr key={portfolio.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{portfolio.name}</div>
                    <div className="text-sm text-gray-500">{formatDateShort(portfolio.created_at)}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {portfolio.metrics?.asset_count || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${getColorForPerformance(portfolio.metrics?.return_3y || 0)}`}>
                  {formatPercentage(portfolio.metrics?.return_3y || 0)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatPercentage(portfolio.metrics?.volatility_3y || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {portfolio.metrics?.sharpe_3y?.toFixed(2) || '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-8 w-20">
                  <svg viewBox="0 0 100 30" className="h-full w-full">
                    <path
                      d={`M0,15 Q25,${Math.random() * 20} 50,${Math.random() * 20} T100,${Math.random() * 20}`}
                      fill="none"
                      stroke={(portfolio.metrics?.return_3y || 0) > 0 ? "#10b981" : "#ef4444"}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${getColorForPerformance(portfolio.metrics?.return_1y || 0)}`}>
                  {formatPercentage(portfolio.metrics?.return_1y || 0)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${getColorForPerformance((portfolio.metrics?.return_1y || 0) / 2)}`}>
                  {formatPercentage((portfolio.metrics?.return_1y || 0) / 2)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatPercentage(60 + Math.random() * 30)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {Math.floor(Math.random() * 5) + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link to={`/portfolios/${portfolio.id}`} className="text-blue-600 hover:text-blue-900">
                    <Eye className="h-5 w-5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-4 px-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{portfolios.length}</span> of <span className="font-medium">{portfolios.length}</span> results
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioList;
