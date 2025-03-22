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
import { X, ArrowRight, RotateCw, CheckCircle2, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useNotificationStore } from '@/store/notifications';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  status: 'idle' | 'processing' | 'completed' | 'error';
}

interface PromptTemplate {
  agentId: string;
  fields: PromptField[];
}

interface PromptField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  placeholder: string;
  options?: string[];
  description?: string;
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
  const [activeTab, setActiveTab] = useState<string>('');
  const [promptInputs, setPromptInputs] = useState<Record<string, any>>({});
  
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

  // Get prompt templates for each agent
  const getPromptTemplates = (): PromptTemplate[] => {
    return configuredAgents.map(ca => {
      // Default fields all agents need
      const commonFields: PromptField[] = [
        {
          name: 'market_type',
          label: 'Market Type',
          type: 'text',
          required: true,
          placeholder: 'e.g., B2B SaaS, Retail, Healthcare',
          description: 'Type of market the analysis is for'
        },
        {
          name: 'brand_tone',
          label: 'Brand Tone',
          type: 'select',
          required: true,
          placeholder: 'Select brand tone',
          options: ['professional', 'casual', 'technical', 'friendly', 'authoritative'],
          description: 'The tone of voice for your brand'
        }
      ];
      
      // Agent-specific fields
      let agentFields: PromptField[] = [];
      
      switch(ca.agent.backendId) {
        case 'competitor_analysis':
          agentFields = [
            {
              name: 'competitors',
              label: 'Competitors',
              type: 'multiselect',
              required: true,
              placeholder: 'Add competitor',
              description: 'List major competitors to analyze'
            },
            {
              name: 'competitor_strengths',
              label: 'Competitor Strengths to Analyze',
              type: 'multiselect',
              required: false,
              placeholder: 'Add area of strength',
              options: ['pricing', 'features', 'market share', 'brand reputation', 'customer service'],
              description: 'Areas of strength to analyze for each competitor'
            }
          ];
          break;
          
        case 'product_recommendations':
          agentFields = [
            {
              name: 'products',
              label: 'Products',
              type: 'multiselect',
              required: true,
              placeholder: 'Add product',
              description: 'Your current products to analyze'
            },
            {
              name: 'target_market_segments',
              label: 'Target Market Segments',
              type: 'multiselect',
              required: true,
              placeholder: 'Add market segment',
              description: 'Market segments you want to target'
            }
          ];
          break;
          
        case 'content_creation':
          agentFields = [
            {
              name: 'target_audience',
              label: 'Target Audience',
              type: 'text',
              required: true,
              placeholder: 'e.g., Tech decision-makers, HR professionals',
              description: 'Primary audience for your content'
            },
            {
              name: 'content_type',
              label: 'Content Type',
              type: 'select',
              required: true,
              placeholder: 'Select content type',
              options: ['blog post', 'social media', 'email campaign', 'white paper', 'case study'],
              description: 'Type of content to generate'
            },
            {
              name: 'key_message',
              label: 'Key Message',
              type: 'textarea',
              required: true,
              placeholder: 'Main message you want to convey',
              description: 'Core message for your content'
            }
          ];
          break;
          
        case 'sales_enablement':
          agentFields = [
            {
              name: 'marketing_channels',
              label: 'Marketing Channels',
              type: 'multiselect',
              required: true,
              placeholder: 'Add channel',
              options: ['email', 'social media', 'search ads', 'content marketing', 'events'],
              description: 'Marketing channels you utilize'
            },
            {
              name: 'pricing_strategy',
              label: 'Pricing Strategy',
              type: 'select',
              required: true,
              placeholder: 'Select pricing strategy',
              options: ['premium', 'competitive', 'freemium', 'subscription', 'value-based'],
              description: 'Your current pricing approach'
            },
            {
              name: 'sales_cycle_length',
              label: 'Sales Cycle Length',
              type: 'select',
              required: false,
              placeholder: 'Select sales cycle length',
              options: ['short (< 1 month)', 'medium (1-3 months)', 'long (3+ months)'],
              description: 'Typical length of your sales cycle'
            }
          ];
          break;
          
        case 'trend_identification':
          agentFields = [
            {
              name: 'industry_focus',
              label: 'Industry Focus',
              type: 'text',
              required: true,
              placeholder: 'e.g., Technology, Healthcare, Finance',
              description: 'Specific industry to analyze'
            },
            {
              name: 'time_horizon',
              label: 'Time Horizon',
              type: 'select',
              required: true,
              placeholder: 'Select time horizon',
              options: ['short-term (3-6 months)', 'medium-term (6-12 months)', 'long-term (1-3 years)'],
              description: 'Time frame for trend analysis'
            }
          ];
          break;
      }
      
      return {
        agentId: ca.agent.backendId,
        fields: [...commonFields, ...agentFields]
      };
    });
  };

  const handlePromptInputChange = (agentId: string, field: string, value: any) => {
    setPromptInputs(prev => ({
      ...prev,
      [agentId]: {
        ...(prev[agentId] || {}),
        [field]: value
      }
    }));
  };

  const handleLaunchWorkflow = () => {
    if (configuredAgents.length === 0) {
      addNotification({
        message: 'Please add at least one agent to the workflow',
        type: 'warning'
      });
      return;
    }
    
    // Initialize the results for each configured agent
    const initialResults = configuredAgents.map(ca => ({
      agentId: ca.agent.backendId,
      agentName: ca.agent.name,
      output: '',
      timestamp: new Date().toISOString(),
      status: 'idle' as const
    }));
    
    setResults(initialResults);
    setActiveTab(initialResults[0]?.agentId || '');
    setShowInputForm(true);
    
    // Initialize prompt inputs if needed
    const templates = getPromptTemplates();
    const initialInputs: Record<string, any> = {};
    
    templates.forEach(template => {
      initialInputs[template.agentId] = initialInputs[template.agentId] || {};
      template.fields.forEach(field => {
        if (field.type === 'multiselect') {
          initialInputs[template.agentId][field.name] = initialInputs[template.agentId][field.name] || [''];
        } else {
          initialInputs[template.agentId][field.name] = initialInputs[template.agentId][field.name] || '';
        }
      });
    });
    
    setPromptInputs(initialInputs);
    
    // Scroll to input form
    setTimeout(() => {
      document.getElementById('input-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    
    // Update result status to processing
    setResults(prev => prev.map(result => ({
      ...result,
      status: 'processing'
    })));
    
    // Execute each agent one by one
    try {
      // Call the API endpoint with all agent inputs at once
      const response = await fetch('/api/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentIds: configuredAgents.map(ca => ca.agent.backendId),
          userInputs: promptInputs
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process agents');
      }
      
      // Update results with API response
      setResults(data.results);
      
      addNotification({
        message: 'Workflow execution completed successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error executing workflow:', error);
      
      // Update status to error for all agents
      setResults(prev => prev.map(result => ({
        ...result,
        status: 'error',
        output: 'Error processing agent. Please try again.'
      })));
      
      addNotification({
        message: 'Error executing workflow',
        type: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleAddMultiselectItem = (agentId: string, field: string) => {
    setPromptInputs(prev => {
      const agentInputs = prev[agentId] || {};
      const currentValues = agentInputs[field] || [''];
      
      return {
        ...prev,
        [agentId]: {
          ...agentInputs,
          [field]: [...currentValues, '']
        }
      };
    });
  };
  
  const handleRemoveMultiselectItem = (agentId: string, field: string, index: number) => {
    setPromptInputs(prev => {
      const agentInputs = prev[agentId] || {};
      const currentValues = [...(agentInputs[field] || [''])];
      
      if (currentValues.length > 1) {
        currentValues.splice(index, 1);
      } else {
        currentValues[0] = '';
      }
      
      return {
        ...prev,
        [agentId]: {
          ...agentInputs,
          [field]: currentValues
        }
      };
    });
  };
  
  const handleMultiselectChange = (agentId: string, field: string, index: number, value: string) => {
    setPromptInputs(prev => {
      const agentInputs = prev[agentId] || {};
      const currentValues = [...(agentInputs[field] || [''])];
      currentValues[index] = value;
      
      return {
        ...prev,
        [agentId]: {
          ...agentInputs,
          [field]: currentValues
        }
      };
    });
  };

  const promptTemplates = getPromptTemplates();

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-500" />
            Provide Input for Your Workflow
          </h3>
          
          <Tabs defaultValue={promptTemplates[0]?.agentId} className="w-full">
            <TabsList className="mb-4 w-full overflow-x-auto flex whitespace-nowrap pb-2">
              {promptTemplates.map((template, index) => {
                const agent = configuredAgents.find(ca => ca.agent.backendId === template.agentId)?.agent;
                if (!agent) return null;
                
                return (
                  <TabsTrigger 
                    key={template.agentId} 
                    value={template.agentId}
                    className="flex items-center gap-2"
                  >
                    <agent.icon className="h-4 w-4" />
                    <span>{agent.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {promptTemplates.map((template) => {
              const agent = configuredAgents.find(ca => ca.agent.backendId === template.agentId)?.agent;
              if (!agent) return null;
              
              return (
                <TabsContent key={template.agentId} value={template.agentId} className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <agent.icon className="h-5 w-5 text-blue-500" />
                      {agent.name} Input
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {template.fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
                          )}
                          
                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={promptInputs[template.agentId]?.[field.name] || ''}
                              onChange={(e) => handlePromptInputChange(template.agentId, field.name, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                          )}
                          
                          {field.type === 'textarea' && (
                            <textarea
                              value={promptInputs[template.agentId]?.[field.name] || ''}
                              onChange={(e) => handlePromptInputChange(template.agentId, field.name, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                          )}
                          
                          {field.type === 'select' && (
                            <select
                              value={promptInputs[template.agentId]?.[field.name] || ''}
                              onChange={(e) => handlePromptInputChange(template.agentId, field.name, e.target.value)}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">{field.placeholder}</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                          
                          {field.type === 'multiselect' && (
                            <div className="space-y-2">
                              {(promptInputs[template.agentId]?.[field.name] || [''])?.map((item: string, index: number) => (
                                <div key={`${field.name}-${index}`} className="flex items-center gap-2">
                                  {field.options ? (
                                    <select
                                      value={item}
                                      onChange={(e) => handleMultiselectChange(template.agentId, field.name, index, e.target.value)}
                                      required={field.required && index === 0}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="">{field.placeholder}</option>
                                      {field.options.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => handleMultiselectChange(template.agentId, field.name, index, e.target.value)}
                                      placeholder={field.placeholder}
                                      required={field.required && index === 0}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMultiselectItem(template.agentId, field.name, index)}
                                    className="p-2 text-red-500 hover:text-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddMultiselectItem(template.agentId, field.name)}
                                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1"
                              >
                                + Add {field.label.toLowerCase()}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleExecuteWorkflow}
              disabled={isExecuting}
              className={`
                px-6 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-colors flex items-center gap-2
                ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Execute Workflow
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Workflow Results
          </h3>
          
          <Tabs defaultValue={results[0]?.agentId} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full overflow-x-auto flex whitespace-nowrap pb-2">
              {results.map((result) => {
                const agent = configuredAgents.find(ca => ca.agent.backendId === result.agentId)?.agent;
                if (!agent) return null;
                
                return (
                  <TabsTrigger 
                    key={result.agentId} 
                    value={result.agentId}
                    disabled={result.status === 'idle'}
                    className="flex items-center gap-2"
                  >
                    <agent.icon className="h-4 w-4" />
                    <span>{result.agentName}</span>
                    {result.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {result.status === 'error' && <X className="h-3 w-3 text-red-500" />}
                    {result.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {results.map((result) => (
              <TabsContent key={result.agentId} value={result.agentId} className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      {result.agentName} Output
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  {result.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Processing your request...</p>
                    </div>
                  )}
                  
                  {result.status === 'error' && (
                    <div className="flex flex-col items-center justify-center py-10 text-red-500">
                      <X className="h-10 w-10 mb-4" />
                      <p>An error occurred while processing this agent.</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-lg flex items-center gap-2"
                        onClick={() => {
                          // Reset this specific agent result
                          setResults(prev => prev.map(r => 
                            r.agentId === result.agentId 
                              ? {...r, status: 'idle', output: ''} 
                              : r
                          ));
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry
                      </button>
                    </div>
                  )}
                  
                  {result.status === 'completed' && result.output && (
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>
                        {result.output}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Playground; 