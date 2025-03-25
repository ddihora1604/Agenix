'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// Define the ResultStatus type
type ResultStatus = 'idle' | 'processing' | 'completed' | 'error';

// Define valid source types
type ResultSource = 'file' | 'simulated' | 'none';

interface Result {
  agentId: string;
  agentName: string;
  status: ResultStatus;
  output: string;
  timestamp: string;
  source?: ResultSource;
  error?: string;
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
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [promptInputs, setPromptInputs] = useState<Record<string, any>>({});
  const [activeWorkflowState, setActiveWorkflowState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  
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

  // Add polling interval ref to track when to stop polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add function to check for markdown files
  const checkMarkdownFiles = async () => {
    if (activeWorkflowState !== 'running') {
      console.log('Not checking for markdown files - workflow not running');
      return;
    }
    
    console.log('Checking for markdown files...');
    
    // Only check for agents that are in non-completed state
    const pendingAgents = results.filter(result => result.status !== 'completed' && result.status !== 'error');
    console.log(`Found ${pendingAgents.length} pending agents to check`);
    
    if (pendingAgents.length === 0) {
      // Stop polling if all agents are complete or in error state
      console.log('No pending agents to check, stopping polling');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Check if we need to update workflow state
      const allResults = results.every(r => r.status === 'completed' || r.status === 'error');
      if (allResults && activeWorkflowState === 'running') {
        setActiveWorkflowState('complete');
        addNotification({
          message: 'All agent tasks have completed',
          type: 'success'
        });
      }
      
      return;
    }
    
    // Check for markdown files for each pending agent
    for (const result of pendingAgents) {
      console.log(`Checking markdown file for agent: ${result.agentId}`);
      try {
        const response = await fetch(`/api/markdown?agentId=${result.agentId}`);
        
        console.log(`API response for ${result.agentId}: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Found markdown file for ${result.agentId}`, data);
          
          // Only update if we have actual content from a file
          if (data.content && data.source === 'file') {
            // Update the result with the markdown content
            setResults(prev => {
              console.log('Updating results state with markdown content');
              return prev.map(r => 
                r.agentId === result.agentId 
                  ? { 
                      ...r, 
                      status: 'completed', 
                      output: data.content,
                      source: 'file'
                    } 
                  : r
              );
            });
            
            // Add a notification
            addNotification({
              message: `${result.agentName} markdown file has been loaded`,
              type: 'success'
            });
          } else {
            console.log(`No content in markdown file for ${result.agentId}`);
          }
        } else if (response.status !== 404) {
          // Log other errors (not including 404 which is expected)
          const errorData = await response.json();
          console.error(`Error fetching markdown file for ${result.agentId}:`, errorData);
        } else {
          console.log(`No markdown file found for ${result.agentId} (404)`);
        }
      } catch (error) {
        console.error(`Error checking markdown file for ${result.agentId}:`, error);
      }
    }
  };
  
  // Start/stop polling when workflow state changes
  useEffect(() => {
    if (activeWorkflowState === 'running') {
      // Start polling every 3 seconds
      pollingIntervalRef.current = setInterval(checkMarkdownFiles, 3000);
    } else {
      // Stop polling when workflow is not running
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeWorkflowState, results]);

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
    // Update workflow state to running
    setActiveWorkflowState('running');
    console.log('Starting workflow execution, setting state to running');
    
    // Reset results and set status to processing for all configured agents
    const initialResults = configuredAgents.map(ca => ({
      agentId: ca.agent.backendId,
      agentName: ca.agent.name,
      status: 'processing' as ResultStatus,
      output: '',
      timestamp: new Date().toISOString(),
      source: 'none' as ResultSource
    }));
    
    console.log('Initializing results with processing status', initialResults);
    setResults(initialResults);
    setIsExecuting(true);
    
    // Start polling immediately
    console.log('Starting polling for markdown files');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(checkMarkdownFiles, 3000);
    
    try {
      // Get combined inputs
      const agentInputs: Record<string, any> = {};
      
      Object.keys(promptInputs).forEach(agentId => {
        agentInputs[agentId] = promptInputs[agentId] || {};
      });
      
      // Make API call to trigger marketing workflow
      console.log('Making API call to /api/marketing with agent IDs:', configuredAgents.map(ca => ca.agent.backendId));
      const response = await fetch('/api/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentIds: configuredAgents.map(ca => ca.agent.backendId),
          userInputs: agentInputs
        }),
      });
      
      if (!response.ok) {
        console.error('API call failed with status:', response.status);
        throw new Error('Failed to execute workflow');
      }
      
      const data = await response.json();
      console.log('API response received:', data);
      
      // Update results with API response, but only for actual file content
      setResults(prev => {
        // Create a map of existing completed results with file sources to preserve them
        const completedResults = prev.reduce((acc, result) => {
          if (result.status === 'completed' && result.source === 'file') {
            acc[result.agentId] = result;
          }
          return acc;
        }, {} as Record<string, typeof prev[0]>);
        
        console.log('Updating results with API response');
        
        // Update with new data, preserving completed results with files
        return data.results.map((newResult: any) => {
          // If we already have a completed result with file source, keep it
          if (completedResults[newResult.agentId]) {
            console.log(`Preserving completed result for ${newResult.agentId}`);
            return completedResults[newResult.agentId];
          }
          
          // Only set completed if the result has content and comes from a file
          if (newResult.status === 'completed' && newResult.source === 'file' && newResult.output) {
            console.log(`Setting completed result for ${newResult.agentId} from file`);
            return newResult;
          }
          
          // Otherwise, keep the agent in processing state
          return {
            ...newResult,
            status: newResult.status === 'error' ? 'error' : 'processing',
            output: '', // Clear any simulated output
            source: 'none'
          };
        });
      });
      
      // Check if all agents are now complete
      const allComplete = data.results.every((result: any) => 
        (result.status === 'completed' && result.source === 'file') || result.status === 'error'
      );
      
      if (allComplete) {
        console.log('All agents are complete with file content, setting workflow state to complete');
        setActiveWorkflowState('complete');
        
        // Stop polling when all are complete
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        addNotification({
          message: 'All markdown files have been loaded',
          type: 'success'
        });
      } else {
        // If not all complete, continue polling
        console.log('Some agents are still processing, continuing to poll');
        addNotification({
          message: 'Checking for markdown files in output directory...',
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      
      // Set all processing results to error
      setResults(prev => prev.map(result => 
        result.status === 'processing' 
          ? {...result, status: 'error' as ResultStatus, error: (error as Error).message, source: 'none'} 
          : result
      ));
      
      // Set workflow state to error
      setActiveWorkflowState('error');
      
      // Add error notification
      addNotification({
        message: 'An error occurred while executing the workflow',
        type: 'error'
      });
      
      // Stop polling on error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
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
                              className="w-full px-3 py-2 border-2 border-gray-300 bg-white text-gray-900 dark:border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300"
                            />
                          )}
                          
                          {field.type === 'textarea' && (
                            <textarea
                              value={promptInputs[template.agentId]?.[field.name] || ''}
                              onChange={(e) => handlePromptInputChange(template.agentId, field.name, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              rows={4}
                              className="w-full px-3 py-2 border-2 border-gray-300 bg-white text-gray-900 dark:border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300"
                            />
                          )}
                          
                          {field.type === 'select' && (
                            <select
                              value={promptInputs[template.agentId]?.[field.name] || ''}
                              onChange={(e) => handlePromptInputChange(template.agentId, field.name, e.target.value)}
                              required={field.required}
                              className="w-full px-3 py-2 border-2 border-gray-300 bg-white text-gray-900 dark:border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300"
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
                                      className="w-full px-3 py-2 border-2 border-gray-300 bg-white text-gray-900 dark:border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300"
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
                                      className="w-full px-3 py-2 border-2 border-gray-300 bg-white text-gray-900 dark:border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300"
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
        <div id="results-section" className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Workflow Results
          </h3>
          
          <Tabs defaultValue={results[0]?.agentId} className="w-full">
            <TabsList className="mb-4 w-full overflow-x-auto flex whitespace-nowrap pb-2">
              {results.map((result) => {
                const agent = configuredAgents.find(ca => ca.agent.backendId === result.agentId)?.agent;
                if (!agent) return null;
                
                return (
                  <TabsTrigger 
                    key={result.agentId} 
                    value={result.agentId}
                    className="flex items-center gap-2"
                  >
                    <agent.icon className="h-4 w-4" />
                    <span>{agent.name}</span>
                    {result.status === 'processing' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-1"></span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {results.map((result) => (
              <TabsContent key={result.agentId} value={result.agentId} className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {(() => {
                        const agent = configuredAgents.find(ca => ca.agent.backendId === result.agentId)?.agent;
                        if (!agent) return null;
                        return (
                          <>
                            <agent.icon className="h-5 w-5 text-blue-500" />
                            {agent.name} Results
                          </>
                        );
                      })()}
                    </h4>
                    
                    {result.status === 'completed' && result.source && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.source === 'file' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}>
                        {result.source === 'file' ? 'From File' : 'Simulated'}
                      </span>
                    )}
                  </div>
                  
                  {result.status === 'idle' && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <RotateCw className="h-10 w-10 mb-4" />
                      <p>This agent has not been executed yet.</p>
                    </div>
                  )}
                  
                  {result.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-10 text-blue-500">
                      <Loader2 className="h-10 w-10 mb-4 animate-spin" />
                      <p>Processing...</p>
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
                              ? {...r, status: 'idle' as ResultStatus, output: ''} 
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
                      {result.source === 'file' ? (
                        <>
                          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                            Content from markdown file in output directory: 
                            <code className="ml-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                              {result.agentId}.md
                            </code>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-auto">
                            <ReactMarkdown>
                              {result.output}
                            </ReactMarkdown>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 rounded border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-100 mb-4">
                          <p className="text-sm font-medium">No markdown content found in output directory</p>
                          <p className="text-xs mt-1">The system is showing a default preview.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {result.status === 'completed' && !result.output && (
                    <div className="flex flex-col items-center justify-center py-10 text-amber-500">
                      <div className="text-center">
                        <p className="mb-2">The markdown file was found but contains no content.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Check that the file exists and has content in the output directory: 
                          <code className="ml-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            marketing_ai/marketing_ai/output/{result.agentId}.md
                          </code>
                        </p>
                      </div>
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