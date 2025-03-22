'use client';

import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Users, Zap, Clock, Cpu, Brain, TrendingUp, Calendar, Mail, FileText, Lightbulb, Book, Search, PenTool, Briefcase, DollarSign, Target, ShoppingCart, BarChart, FileEdit, Rocket } from 'lucide-react';
import AgentCard from '@/components/AgentCard';
import WorkflowSelector from '@/components/WorkflowSelector';
import Playground from '@/components/Playground';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const agentCategories = [
    {
      title: "Marketing Agents",
      description: "AI-powered tools for marketing optimization and analysis",
      agents: [
        {
          id: 1,
          name: "Competitor Watchdog",
          description: "Monitor and analyze competitor activities in real-time",
          icon: Target,
          category: "Marketing"
        },
        {
          id: 2,
          name: "Product Recommender",
          description: "AI-driven product recommendations based on customer behavior",
          icon: ShoppingCart,
          category: "Marketing"
        },
        {
          id: 3,
          name: "Trend Analyst",
          description: "Identify and analyze market trends and patterns",
          icon: TrendingUp,
          category: "Marketing"
        },
        {
          id: 4,
          name: "Content Creator",
          description: "Generate engaging marketing content automatically",
          icon: FileEdit,
          category: "Marketing"
        },
        {
          id: 5,
          name: "Sales Strategist",
          description: "Develop data-driven sales strategies",
          icon: BarChart,
          category: "Marketing"
        }
      ]
    },
    {
      title: "Corporate Productivity Agents",
      description: "Enhance workplace efficiency and collaboration",
      agents: [
        {
          id: 6,
          name: "Meeting Summarizer Agent",
          description: "Automatically generate comprehensive meeting summaries",
          icon: Brain,
          category: "Productivity"
        },
        {
          id: 7,
          name: "Task Scheduler Agent",
          description: "Intelligent task scheduling and prioritization",
          icon: Calendar,
          category: "Productivity"
        },
        {
          id: 8,
          name: "Email Manager Agent",
          description: "Smart email organization and response automation",
          icon: Mail,
          category: "Productivity"
        },
        {
          id: 9,
          name: "Report Generator Agent",
          description: "Automated business report creation and analysis",
          icon: FileText,
          category: "Productivity"
        },
        {
          id: 10,
          name: "Strategy Recommender Agent",
          description: "AI-powered business strategy recommendations",
          icon: Lightbulb,
          category: "Productivity"
        }
      ]
    },
    {
      title: "Education Agents",
      description: "Advanced AI tools for enhanced learning experiences",
      agents: [
        {
          id: 11,
          name: "Learning Journey Orchestrator",
          description: "Personalized learning path creation and management",
          icon: Rocket,
          category: "Education"
        },
        {
          id: 12,
          name: "Content Curator",
          description: "Intelligent educational content curation and organization",
          icon: Book,
          category: "Education"
        },
        {
          id: 13,
          name: "Assessment Engine",
          description: "Automated assessment creation and grading",
          icon: FileText,
          category: "Education"
        },
        {
          id: 14,
          name: "Study Buddy",
          description: "Interactive AI-powered study assistance",
          icon: Users,
          category: "Education"
        },
        {
          id: 15,
          name: "Research Assistant",
          description: "Advanced research support and analysis",
          icon: Search,
          category: "Education"
        },
        {
          id: 16,
          name: "Writing Coach",
          description: "AI-powered writing improvement and feedback",
          icon: PenTool,
          category: "Education"
        },
        {
          id: 17,
          name: "Project Manager",
          description: "Educational project planning and tracking",
          icon: Briefcase,
          category: "Education"
        }
      ]
    },
    {
      title: "Finance Agents",
      description: "AI solutions for financial management and analysis",
      agents: [
        {
          id: 18,
          name: "Financial Analyzer",
          description: "Comprehensive financial data analysis and reporting",
          icon: DollarSign,
          category: "Finance"
        }
      ]
    }
  ];

  const statCards = [
    { title: 'Active Users', value: '1,245', icon: Users, change: '+5.3%', color: 'blue' },
    { title: 'Workflows Created', value: '832', icon: Zap, change: '+12.7%', color: 'indigo' },
    { title: 'Avg. Completion Time', value: '1.2m', icon: Clock, change: '-8.1%', color: 'green' },
    { title: 'AI Agents Used', value: '28', icon: Cpu, change: '+3.2%', color: 'purple' },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Workflow Executions',
        data: [65, 59, 80, 81, 56, 55, 70],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
      },
      {
        label: 'AI Agent Usage',
        data: [28, 48, 40, 19, 86, 27, 90],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const [selectedWorkflow, setSelectedWorkflow] = useState("Marketing");
  
  const workflows = ["Marketing", "Corporate Productivity", "Education", "Finance"];
  
  const filteredAgents = agentCategories
    .find(category => category.title.includes(selectedWorkflow))
    ?.agents || [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        AI Agent Dashboard
      </h1>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Workflow Playground
        </h2>
        
        <WorkflowSelector
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          onSelect={setSelectedWorkflow}
        />
        
        <Playground
          selectedWorkflow={selectedWorkflow}
          agents={filteredAgents}
        />
      </section>
    </div>
  );
};

export default Dashboard; 