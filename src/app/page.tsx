'use client';

import AgentCard from '@/components/AgentCard';
import WorkflowTemplateCard from '@/components/WorkflowTemplateCard';
import { Activity, Box, Brain, Briefcase, Building2, Scale, Zap } from 'lucide-react';

export default function Home() {
  const agents = [
    {
      id: 1,
      name: 'SEO Optimizer',
      description: 'Optimize content for search engines using advanced AI techniques',
      icon: Activity,
      category: 'Marketing',
    },
    {
      id: 2,
      name: 'Meeting Summarizer',
      description: 'Automatically generate concise meeting summaries and action items',
      icon: Brain,
      category: 'Productivity',
    },
    {
      id: 3,
      name: 'Contract Analyzer',
      description: 'AI-powered contract analysis and risk assessment',
      icon: Scale,
      category: 'Legal',
    },
  ];

  const workflowTemplates = [
    {
      id: 1,
      name: 'Marketing Agency Suite',
      description: 'Complete workflow for digital marketing agencies',
      icon: Building2,
      agents: ['SEO Optimizer', 'Competitor Watchdog', 'Smart Email Manager'],
    },
    {
      id: 2,
      name: 'Corporate Productivity',
      description: 'Streamline your business operations',
      icon: Briefcase,
      agents: ['Meeting Summarizer', 'Smart Email Manager', 'Customer Feedback Analyzer'],
    },
    {
      id: 3,
      name: 'Legal Compliance',
      description: 'Automated legal document processing and compliance',
      icon: Box,
      agents: ['Contract Summarizer', 'Regulatory Compliance Watchdog', 'AI Research Assistant'],
    },
  ];

  return (
    <div>
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured AI Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pre-built Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowTemplates.map((template) => (
            <WorkflowTemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
}