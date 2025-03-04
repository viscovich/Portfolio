import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings } from 'lucide-react';
import AISettingsModal from './AISettingsModal';

const Navbar: React.FC = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                InvestAI Portfolio
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="AI Settings"
            >
              <Settings className="h-6 w-6" />
            </button>
            <button className="ml-3 p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <User className="h-6 w-6" />
            </button>
            
            <AISettingsModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
