'use client';

import React from 'react';
import { Search, Cpu } from 'lucide-react';

const MarketplaceHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Cpu className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Agent Marketplace</h1>
          </div>
          
          <div className="w-full md:w-96">
            <div className="relative">
              <input
                type="text"
                placeholder="Search agents and workflows..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex space-x-4">
            <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
              Browse Agents
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Create Workflow
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MarketplaceHeader;