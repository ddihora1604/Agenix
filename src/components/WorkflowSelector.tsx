'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface WorkflowSelectorProps {
  workflows: string[];
  selectedWorkflow: string;
  onSelect: (workflow: string) => void;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  selectedWorkflow,
  onSelect,
}) => {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {workflows.map((workflow) => (
        <button
          key={workflow}
          onClick={() => onSelect(workflow)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            selectedWorkflow === workflow
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
        >
          {workflow}
        </button>
      ))}
    </div>
  );
};

export default WorkflowSelector; 