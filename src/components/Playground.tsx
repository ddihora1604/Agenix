'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import AgentCard from './AgentCard';
import { LucideProps } from 'lucide-react';
import { X, ArrowRight } from 'lucide-react';
import { useNotificationStore } from '@/store/notifications';

interface PlaygroundProps {
  selectedWorkflow: string;
  agents: Array<{
    id: number;
    name: string;
    description: string;
    icon: React.ComponentType<LucideProps>;
    category: string;
  }>;
}

interface ConfiguredAgent {
  id: string;
  agent: PlaygroundProps['agents'][0];
}

const SortableAgentItem = ({ agent, id, onRemove }: { 
  agent: PlaygroundProps['agents'][0];
  id: string;
  onRemove: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="relative group bg-gray-50 dark:bg-gray-900 rounded-lg p-3 cursor-move"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-500 dark:text-gray-400 select-none">⋮⋮</span>
        <div className="flex-grow">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{agent.description}</p>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Playground: React.FC<PlaygroundProps> = ({ selectedWorkflow, agents }) => {
  const [configuredAgents, setConfiguredAgents] = useState<ConfiguredAgent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'configured-workflow',
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const { addNotification } = useNotificationStore();

  const handleConfigureAgent = (agent: PlaygroundProps['agents'][0]) => {
    const newId = `${agent.id}-${Date.now()}`;
    if (!configuredAgents.some(ca => ca.agent.id === agent.id)) {
      setConfiguredAgents(prev => [...prev, { id: newId, agent }]);
      addNotification({
        message: `${agent.name} added to workflow`,
        type: 'success'
      });
    }
  };

  const handleRemoveAgent = (id: string) => {
    const agent = configuredAgents.find(ca => ca.id === id)?.agent;
    setConfiguredAgents(prev => prev.filter(ca => ca.id !== id));
    if (agent) {
      addNotification({
        message: `${agent.name} removed from workflow`,
        type: 'info'
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) return;

    if (active.id !== over.id) {
      setConfiguredAgents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        addNotification({
          message: 'Workflow order updated',
          type: 'info'
        });
        
        return reorderedItems;
      });
    }

    setActiveId(null);
  };

  const handleLaunchWorkflow = async () => {
    setIsExecuting(true);
    addNotification({
      message: 'Workflow execution started',
      type: 'info'
    });
    
    for (const { agent } of configuredAgents) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Executing agent: ${agent.name}`);
        addNotification({
          message: `${agent.name} executed successfully`,
          type: 'success'
        });
      } catch (error) {
        console.error(`Error executing agent ${agent.name}:`, error);
        addNotification({
          message: `Error executing ${agent.name}`,
          type: 'error'
        });
        break;
      }
    }
    
    setIsExecuting(false);
    addNotification({
      message: 'Workflow execution completed',
      type: 'success'
    });
  };

  const draggedAgent = activeId 
    ? (typeof activeId === 'number' 
        ? agents.find(a => a.id === activeId)
        : configuredAgents.find(ca => ca.id === activeId)?.agent)
    : null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {selectedWorkflow} Workflow
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure or drag agents to create your workflow
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onConfigure={() => handleConfigureAgent(agent)}
              isConfigured={configuredAgents.some(ca => ca.agent.id === agent.id)}
              isDraggable
            />
          ))}
        </div>

        <div
          ref={setDroppableRef}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configured Workflow
            </h3>
            {configuredAgents.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {configuredAgents.length} agent{configuredAgents.length !== 1 ? 's' : ''} configured
              </span>
            )}
          </div>

          <SortableContext items={configuredAgents.map(ca => ca.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {configuredAgents.map((configuredAgent, index) => (
                <SortableAgentItem
                  key={configuredAgent.id}
                  id={configuredAgent.id}
                  agent={configuredAgent.agent}
                  onRemove={handleRemoveAgent}
                />
              ))}
            </div>
          </SortableContext>

          {configuredAgents.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              Configure or drag agents here to create your workflow
            </div>
          )}
        </div>

        {configuredAgents.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleLaunchWorkflow}
              disabled={isExecuting}
              className={`
                px-6 py-2 bg-green-600 text-white rounded-lg 
                hover:bg-green-700 transition-colors flex items-center gap-2
                ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isExecuting ? 'Executing...' : 'Launch Workflow'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <DragOverlay>
          {activeId && draggedAgent && (
            <div className="w-full opacity-75">
              <AgentCard
                agent={draggedAgent}
                onConfigure={() => {}}
                isConfigured={false}
                isDraggable={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Playground; 