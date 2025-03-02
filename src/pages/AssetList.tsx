import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import AssetListComponent from '../components/AssetList';
import { getAssets } from '../services/portfolioService';
import type { Asset } from '../types';

const AssetListPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const data = await getAssets();
        setAssets(data);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssets();
  }, []);
  
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesSector = filterSector === 'all' || asset.sector === filterSector;
    const matchesRegion = filterRegion === 'all' || asset.region === filterRegion;
    
    return matchesSearch && matchesType && matchesSector && matchesRegion;
  });
  
  // Get unique values for filters
  const assetTypes = ['all', ...new Set(assets.map(asset => asset.type))];
  const sectors = ['all', ...new Set(assets.filter(asset => asset.sector).map(asset => asset.sector as string))];
  const regions = ['all', ...new Set(assets.filter(asset => asset.region).map(asset => asset.region as string))];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Add Asset
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <h2 className="text-lg font-medium text-gray-900">Asset List</h2>
            
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex space-x-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {assetTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector === 'all' ? 'All Sectors' : sector}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region === 'all' ? 'All Regions' : region}
                    </option>
                  ))}
                </select>
                
                <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Filter className="h-5 w-5 text-gray-500" />
                </button>
                
                <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Download className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredAssets.length > 0 ? (
          <AssetListComponent assets={filteredAssets} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No assets found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetListPage;