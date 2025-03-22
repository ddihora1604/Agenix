'use client';

import React from 'react';
import { ArrowRight, LucideProps } from 'lucide-react';

interface WorkflowTemplateCardProps {
  template: {
    id: number;
    name: string;
    description: string;
    icon: React.ComponentType<LucideProps>;
    agents: string[];
  };
}

const WorkflowTemplateCard: React.FC<WorkflowTemplateCardProps> = ({ template }) => {
  const Icon = template.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{template.description}</p>
        
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Includes</h4>
          <div className="flex flex-wrap gap-2">
            {template.agents.map((agent, index) => (
              <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-md">
                {agent}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
            View details
          </button>
          <button className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
            Use template <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplateCard;