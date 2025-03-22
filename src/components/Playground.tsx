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
import { X, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '@/store/notifications';
import ReactMarkdown from 'react-markdown';

interface PlaygroundProps {
  selectedWorkflow: string;
  agents: Array<{
    id: number;
    name: string;
    description: string;
    icon: React.ComponentType<LucideProps>;
    category: string;
    backendId: string; // Added to map UI agents to backend IDs
  }>;
}

interface ConfiguredAgent {
  id: string;
  agent: PlaygroundProps['agents'][0];
}

interface AgentResult {
  agentId: string;
  agentName: string;
  output: string;
  timestamp: string;
}

interface InputFieldConfig {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  isArray?: boolean;
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
  const [showInputForm, setShowInputForm] = useState(false);
  const [results, setResults] = useState<AgentResult[]>([]);
  const [formState, setFormState] = useState({
    market: 'B2B SaaS',
    brand_voice: {
      tone: 'professional',
      style: 'technical'
    },
    competitors: [''],
    products: [''],
    target_audience: '',
    personas: [''],
    marketing_channels: [''],
    pricing_strategy: ''
  });
  
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

  const handleSubmitInput = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    addNotification({
      message: 'Processing workflow...',
      type: 'info'
    });
    
    // Extract agent IDs in the correct order
    const agentIds = configuredAgents.map(ca => ca.agent.backendId);
    
    try {
      // Call the API endpoint
      const response = await fetch('/api/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentIds,
          userInputs: formState
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process agents');
      }
      
      setResults(data.results);
      addNotification({
        message: 'Workflow execution completed successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error executing workflow:', error);
      addNotification({
        message: 'Error executing workflow',
        type: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLaunchWorkflow = () => {
    if (configuredAgents.length === 0) {
      addNotification({
        message: 'Please add at least one agent to the workflow',
        type: 'warning'
      });
      return;
    }
    
    setShowInputForm(true);
    setResults([]);
    
    // Scroll to input form
    setTimeout(() => {
      document.getElementById('input-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (like brand_voice.tone)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormState(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayInputChange = (name: string, index: number, value: string) => {
    setFormState(prev => {
      const arr = [...(prev[name as keyof typeof prev] as string[])];
      arr[index] = value;
      return {
        ...prev,
        [name]: arr
      };
    });
  };

  const addArrayItem = (name: string) => {
    setFormState(prev => {
      const arr = [...(prev[name as keyof typeof prev] as string[]), ''];
      return {
        ...prev,
        [name]: arr
      };
    });
  };

  const removeArrayItem = (name: string, index: number) => {
    setFormState(prev => {
      const arr = [...(prev[name as keyof typeof prev] as string[])];
      if (arr.length > 1) {
        arr.splice(index, 1);
      } else {
        arr[0] = '';
      }
      return {
        ...prev,
        [name]: arr
      };
    });
  };

  // Determine which input fields to show based on the configured agents
  const getInputFields = (): InputFieldConfig[] => {
    const baseFields: InputFieldConfig[] = [
      {
        name: 'market',
        label: 'Market Type',
        type: 'text',
        required: true,
        placeholder: 'e.g., B2B SaaS, Retail, Healthcare'
      },
      {
        name: 'brand_voice.tone',
        label: 'Brand Tone',
        type: 'text',
        required: true,
        placeholder: 'e.g., professional, casual, technical'
      },
      {
        name: 'brand_voice.style',
        label: 'Brand Style',
        type: 'text',
        required: true,
        placeholder: 'e.g., conversational, formal, direct'
      }
    ];
    
    const agentSpecificFields: Record<string, InputFieldConfig[]> = {
      'competitor_analysis': [
        {
          name: 'competitors',
          label: 'Competitors',
          type: 'text',
          required: true,
          placeholder: 'Add competitor',
          isArray: true
        }
      ],
      'product_recommendations': [
        {
          name: 'products',
          label: 'Products',
          type: 'text',
          required: true,
          placeholder: 'Add product',
          isArray: true
        }
      ],
      'content_creation': [
        {
          name: 'target_audience',
          label: 'Target Audience',
          type: 'text',
          required: true,
          placeholder: 'e.g., Tech decision-makers, HR professionals'
        },
        {
          name: 'personas',
          label: 'Target Personas',
          type: 'text',
          required: true,
          placeholder: 'Add persona',
          isArray: true
        }
      ],
      'sales_enablement': [
        {
          name: 'marketing_channels',
          label: 'Marketing Channels',
          type: 'text',
          required: true,
          placeholder: 'Add channel',
          isArray: true
        },
        {
          name: 'pricing_strategy',
          label: 'Pricing Strategy',
          type: 'text',
          required: true,
          placeholder: 'e.g., Freemium, Premium, Subscription'
        }
      ]
    };
    
    // Add fields based on configured agents
    let fields = [...baseFields];
    
    configuredAgents.forEach(ca => {
      const backendId = ca.agent.backendId;
      const agentFields = agentSpecificFields[backendId];
      
      if (agentFields) {
        // Only add fields that aren't already included
        agentFields.forEach(field => {
          if (!fields.some(f => f.name === field.name)) {
            fields.push(field);
          }
        });
      }
    });
    
    return fields;
  };

  const inputFields = getInputFields();

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
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {configuredAgents.length > 0 ? 
                `${configuredAgents.length} agent${configuredAgents.length > 1 ? 's' : ''} configured` : 
                'No agents configured'}
            </div>
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

      {showInputForm && (
        <div id="input-form" className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Provide Input for Your Workflow
          </h3>
          <form onSubmit={handleSubmitInput} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputFields.map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.isArray ? (
                    <div className="space-y-2">
                      {(formState[field.name.split('.')[0] as keyof typeof formState] as string[]).map((item, index) => (
                        <div key={`${field.name}-${index}`} className="flex items-center gap-2">
                          <input
                            type={field.type}
                            value={item}
                            onChange={(e) => handleArrayInputChange(field.name, index, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required && index === 0}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem(field.name, index)}
                            className="p-2 text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem(field.name)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1"
                      >
                        + Add {field.label.toLowerCase()}
                      </button>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={
                        field.name.includes('.')
                          ? (formState[field.name.split('.')[0] as keyof typeof formState] as any)[
                              field.name.split('.')[1]
                            ]
                          : (formState[field.name as keyof typeof formState] as string)
                      }
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isExecuting}
                className={`
                  px-6 py-2 bg-blue-600 text-white rounded-lg 
                  hover:bg-blue-700 transition-colors flex items-center gap-2
                  ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isExecuting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Workflow Results
          </h3>
          
          <div className="space-y-6">
            {results.map((result, index) => (
              <div 
                key={result.agentId} 
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    {index + 1}. {result.agentName}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="prose dark:prose-invert max-w-none text-sm mt-2">
                  <ReactMarkdown>
                    {result.output}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Playground; 