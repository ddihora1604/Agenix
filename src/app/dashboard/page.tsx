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
import { Users, Zap, Clock, Cpu, Brain, TrendingUp, Calendar, Mail, FileText, Lightbulb, Book, Search, PenTool, Briefcase, DollarSign, Target, ShoppingCart, BarChart, FileEdit, Rocket, LayoutDashboard, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSidebarState } from '@/hooks/use-sidebar-state';
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
  const router = useRouter();
  const { setShowJobAgent, setCaseStudyAgent } = useSidebarState();

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
          category: "Marketing",
          backendId: "competitor_analysis"
        },
        {
          id: 2,
          name: "Product Recommender",
          description: "AI-driven product recommendations based on customer behavior",
          icon: ShoppingCart,
          category: "Marketing",
          backendId: "product_recommendations"
        },
        {
          id: 3,
          name: "Trend Analyst",
          description: "Identify and analyze market trends and patterns",
          icon: TrendingUp,
          category: "Marketing",
          backendId: "trend_identification"
        },
        {
          id: 4,
          name: "Content Creator",
          description: "Generate engaging marketing content automatically",
          icon: FileEdit,
          category: "Marketing",
          backendId: "content_creation"
        },
        {
          id: 5,
          name: "Sales Strategist",
          description: "Develop data-driven sales strategies",
          icon: BarChart,
          category: "Marketing",
          backendId: "sales_enablement"
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
          category: "Productivity",
          backendId: "meeting_summarizer"
        },
        {
          id: 7,
          name: "Task Scheduler Agent",
          description: "Intelligent task scheduling and prioritization",
          icon: Calendar,
          category: "Productivity",
          backendId: "task_scheduler"
        },
        {
          id: 8,
          name: "Email Manager Agent",
          description: "Smart email organization and response automation",
          icon: Mail,
          category: "Productivity",
          backendId: "email_manager"
        },
        {
          id: 9,
          name: "Report Generator Agent",
          description: "Automated business report creation and analysis",
          icon: FileText,
          category: "Productivity",
          backendId: "report_generator"
        },
        {
          id: 10,
          name: "Strategy Recommender Agent",
          description: "AI-powered business strategy recommendations",
          icon: Lightbulb,
          category: "Productivity",
          backendId: "strategy_recommender"
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
          category: "Education",
          backendId: "learning_journey"
        },
        {
          id: 12,
          name: "Content Curator",
          description: "Intelligent educational content curation and organization",
          icon: Book,
          category: "Education",
          backendId: "content_curator"
        },
        {
          id: 13,
          name: "Assessment Engine",
          description: "Automated assessment creation and grading",
          icon: FileText,
          category: "Education",
          backendId: "assessment_engine"
        },
        {
          id: 14,
          name: "Study Buddy",
          description: "Interactive AI-powered study assistance",
          icon: Users,
          category: "Education",
          backendId: "study_buddy"
        },
        {
          id: 15,
          name: "Research Assistant",
          description: "Advanced research support and analysis",
          icon: Search,
          category: "Education",
          backendId: "research_assistant"
        },
        {
          id: 16,
          name: "Writing Coach",
          description: "AI-powered writing improvement and feedback",
          icon: PenTool,
          category: "Education",
          backendId: "writing_coach"
        },
        {
          id: 17,
          name: "Project Manager",
          description: "Educational project planning and tracking",
          icon: Briefcase,
          category: "Education",
          backendId: "project_manager"
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
          category: "Finance",
          backendId: "financial_analyzer"
        }
      ]
    }
  ];

  const statCards = [
    // { title: 'Active Users', value: '1,245', icon: Users, change: '+5.3%', color: 'blue' },
    // { title: 'Workflows Created', value: '832', icon: Zap, change: '+12.7%', color: 'indigo' },
    // { title: 'Avg. Completion Time', value: '1.2m', icon: Clock, change: '-8.1%', color: 'green' },
    // { title: 'AI Agents Used', value: '28', icon: Cpu, change: '+3.2%', color: 'purple' },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      // {
      //   label: 'Workflow Executions',
      //   data: [65, 59, 80, 81, 56, 55, 70],
      //   borderColor: 'rgb(99, 102, 241)',
      //   backgroundColor: 'rgba(99, 102, 241, 0.1)',
      //   tension: 0.3,
      // },
      // {
      //   label: 'AI Agent Usage',
      //   data: [28, 48, 40, 19, 86, 27, 90],
      //   borderColor: 'rgb(139, 92, 246)',
      //   backgroundColor: 'rgba(139, 92, 246, 0.1)',
      //   tension: 0.3,
      // },
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
    <div className="p-6 max-w-9xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center mb-4">
        <LayoutDashboard className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      {/* Job Agent Card */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-4">
              <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Job Agent Workflow</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Process job descriptions to generate summaries, cold emails, and interview preparation guides
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowJobAgent(true);
              router.push('/agents/job-agent');
            }}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center transition-colors"
          >
            <span>Configure</span>
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Job Summary</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Comprehensive breakdown of job requirements</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Cold Email</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Tailored outreach to potential employers</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Interview Prep</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Preparation guide for upcoming interviews</p>
          </div>
        </div>
      </section>
      
      {/* Case Study Agent Card */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 mr-4">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Case Study Agent Workflow</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Generate professional case studies on any topic with structured content and key insights
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCaseStudyAgent(true);
              router.push('/agents/case-study-agent');
            }}
            className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm flex items-center transition-colors"
          >
            <span>Configure</span>
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Workflow Playground */}
      
    </div>
  );
};

export default Dashboard; 