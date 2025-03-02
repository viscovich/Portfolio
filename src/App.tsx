import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PortfolioDetail from './pages/PortfolioDetail';
import MarketSentiment from './pages/MarketSentiment';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="portfolios/:id" element={<PortfolioDetail />} />
          <Route path="market-sentiment" element={<MarketSentiment />} />
          <Route path="assets" element={<AssetList />} />
          <Route path="assets/:id" element={<AssetDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;