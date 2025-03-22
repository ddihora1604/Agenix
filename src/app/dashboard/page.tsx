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

      {agentCategories.map((category, index) => (
        <section key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {category.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {category.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>
      ))}

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</h3>
                  <span className={`text-xs font-medium mt-2 inline-block ${
                    card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change} from last month
                  </span>
                </div>
                <div className={`p-3 rounded-full bg-${card.color}-100 dark:bg-${card.color}-900/20 text-${card.color}-600 dark:text-${card.color}-400`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Performance Overview</h2>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">New workflow created: Social Media Campaign</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 hours ago • Darshan Dihora</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top AI Agents</h2>
            <div className="space-y-4">
              {['SEO Optimizer', 'Content Generator', 'Email Summarizer', 'Meeting Assistant'].map((agent, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-3">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{agent}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Used in {8 - i * 2} workflows</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{90 - i * 10}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 