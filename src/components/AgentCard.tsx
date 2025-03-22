'use client';

import React from 'react';
import { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { Check, GripVertical } from 'lucide-react';

interface AgentCardProps {
  agent: {
    id: number;
    name: string;
    description: string;
    icon: React.ComponentType<LucideProps>;
    category: string;
  };
  onConfigure: () => void;
  isConfigured: boolean;
  isDraggable?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  onConfigure, 
  isConfigured,
  isDraggable = true
}) => {
  if (!agent) {
    return null;
  }

  const Icon = agent.icon;
  
  const categoryColors: Record<string, string> = {
    'Marketing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Productivity': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Education': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Finance': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'Default': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  };

  const iconColors: Record<string, string> = {
    'Marketing': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    'Productivity': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    'Education': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    'Finance': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    'Default': 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  };
  
  const color = categoryColors[agent.category] || categoryColors.Default;
  const iconColor = iconColors[agent.category] || iconColors.Default;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: agent.id,
    disabled: !isDraggable || isConfigured,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700",
        isDragging && "opacity-50 scale-105",
        isDraggable && !isConfigured && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center",
            iconColors[agent.category] || iconColors.Default
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2">
            {isDraggable && !isConfigured && (
              <GripVertical className="h-5 w-5 text-gray-400" />
            )}
            <span className={cn(
              "text-xs font-medium px-2.5 py-0.5 rounded-full",
              categoryColors[agent.category] || categoryColors.Default
            )}>
              {agent.category}
            </span>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {agent.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {agent.description}
        </p>
        <button
          onClick={onConfigure}
          disabled={isConfigured}
          className={cn(
            "w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            isConfigured
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {isConfigured ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Configured
            </span>
          ) : (
            'Configure'
          )}
        </button>
      </div>
    </div>
  );
};

export default AgentCard;