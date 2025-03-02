import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)]">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
      <p className="text-gray-500 mt-2">The page you are looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="mt-8 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
      >
        <Home className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;