'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, ChevronRight, ChevronLeft, Users, Image, ShoppingCart, 
  Youtube, Mail, BookOpen, Music, Palette, Presentation, FileCheck,
  Lightbulb, Globe, Pencil, GanttChart, FileAudio, Instagram, BarChart2,
  Check, Target, ShoppingBag, TrendingUp, FileEdit, BarChart, Calendar,
  Search, Book, FileText, PenTool, Briefcase, Brain, Building2, DollarSign,
  CreditCard, Shield, Calculator, PieChart, Mail as MailIcon, Clock, LineChart,
  Scale, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the agent interface
interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

// Define the category interface
interface Category {
  id: string;
  name: string;
  agents: Agent[];
}

const AgentsPage: React.FC = () => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const agentsPerPage = 9;

  // Define all agents with their categories and descriptions
  const agentCategories: Category[] = [
    {
      id: 'general',
      name: 'General',
      agents: [
        { id: 'user_persona_builder', name: 'User Persona Builder', description: 'Create detailed user personas for marketing and UX research', icon: Users, category: 'General' },
        { id: 'image_generator', name: 'Image Generator', description: 'Generate creative images based on text descriptions', icon: Image, category: 'General' },
        { id: 'ecommerce_product_description', name: 'E-commerce Product Description Enhancer', description: 'Enhance product descriptions for better conversions', icon: ShoppingCart, category: 'General' },
        { id: 'youtube_summarizer', name: 'YouTube Video Summarizer', description: 'Create concise summaries of YouTube video content', icon: Youtube, category: 'General' },
        { id: 'professional_email_writer', name: 'Professional Email Writer', description: 'Craft professional business emails for various contexts', icon: Mail, category: 'General' },
        { id: 'story_maker', name: 'Story Maker', description: 'Create engaging stories for content marketing', icon: BookOpen, category: 'General' },
        { id: 'youtube_to_mp3', name: 'YouTube Video to MP3 Converter', description: 'Convert YouTube videos to MP3 audio files', icon: Music, category: 'General' },
        { id: 'logo_generator', name: 'Logo Generator', description: 'Generate professional logos based on business requirements', icon: Palette, category: 'General' },
        { id: 'powerpoint_maker', name: 'PowerPoint Maker', description: 'Create professional presentations automatically', icon: Presentation, category: 'General' },
        { id: 'resume_filtering', name: 'Resume Filtering', description: 'Filter and rank resumes based on job requirements', icon: FileCheck, category: 'General' },
        { id: 'prompt_writer', name: 'Prompt Writer', description: 'Generate effective prompts for AI systems', icon: Lightbulb, category: 'General' },
        { id: 'language_translator', name: 'Language Translator', description: 'Translate content between multiple languages', icon: Globe, category: 'General' },
        { id: 'blog_writer', name: 'Blog Writer', description: 'Create engaging blog posts on various topics', icon: Pencil, category: 'General' },
        { id: 'web_scraper', name: 'Web Scraper', description: 'Extract structured data from websites and web pages', icon: GanttChart, category: 'General' },
        { id: 'audio_video_generation', name: 'Audio-Video Generation', description: 'Generate audio and video content for marketing', icon: FileAudio, category: 'General' },
        { id: 'social_media_scraper', name: 'Social Media Scraper', description: 'Extract data from various social media platforms', icon: Instagram, category: 'General' },
        { id: 'statistical_analysis', name: 'Statistical Analysis Agent', description: 'Perform advanced statistical analysis on datasets', icon: BarChart2, category: 'General' },
        { id: 'plagiarism_checker', name: 'Plagiarism & Grammar Checker', description: 'Detect plagiarism and correct grammar in content', icon: Check, category: 'General' },
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing',
      agents: [
        { id: 'competitor_analysis', name: 'Competitor Analysis', description: 'Analyze competitors\' strategies and market positioning', icon: Target, category: 'Marketing' },
        { id: 'product_recommendations', name: 'Product Recommendations', description: 'Generate personalized product recommendations', icon: ShoppingBag, category: 'Marketing' },
        { id: 'trend_identification', name: 'Trend Identification', description: 'Identify emerging trends in your industry', icon: TrendingUp, category: 'Marketing' },
        { id: 'content_creation', name: 'Content Creation', description: 'Create engaging marketing content across channels', icon: FileEdit, category: 'Marketing' },
        { id: 'sales_enablement', name: 'Sales Enablement', description: 'Empower sales teams with AI-driven insights', icon: BarChart, category: 'Marketing' },
      ]
    },
    {
      id: 'education',
      name: 'Education',
      agents: [
        { id: 'learning_planner', name: 'Learning Planner', description: 'Create personalized learning plans for students', icon: Calendar, category: 'Education' },
        { id: 'content_curator', name: 'Content Curator', description: 'Curate relevant educational resources for courses', icon: Search, category: 'Education' },
        { id: 'study_guide_creator', name: 'Study Guide Creator', description: 'Generate comprehensive study guides for any subject', icon: Book, category: 'Education' },
        { id: 'assessment_designer', name: 'Assessment Designer', description: 'Create assessments with varying difficulty levels', icon: FileText, category: 'Education' },
        { id: 'practical_exercise_developer', name: 'Practical Exercise Developer', description: 'Develop hands-on exercises for applied learning', icon: PenTool, category: 'Education' },
        { id: 'learning_coach', name: 'Learning Coach', description: 'Provide personalized coaching for educational goals', icon: Briefcase, category: 'Education' },
        { id: 'research_assistant', name: 'Research Assistant', description: 'Assist with academic research and paper writing', icon: Search, category: 'Education' },
        { id: 'visual_content_analyzer', name: 'Visual Content Analyzer', description: 'Analyze and explain visual educational content', icon: Image, category: 'Education' },
        { id: 'web_resource_explorer', name: 'Web Resource Explorer', description: 'Find and evaluate web resources for learning', icon: Globe, category: 'Education' },
        { id: 'edu_language_translator', name: 'Language Translator', description: 'Translate educational materials into multiple languages', icon: Globe, category: 'Education' },
        { id: 'multimedia_integration', name: 'Multimedia Integration Specialist', description: 'Integrate multimedia elements in educational content', icon: FileAudio, category: 'Education' },
        { id: 'document_analyzer', name: 'Document Analyzer', description: 'Analyze and evaluate academic documents and papers', icon: FileCheck, category: 'Education' },
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      agents: [
        { id: 'finance_advisor', name: 'AI-Powered Personal Finance Advisor', description: 'Provide personalized financial advice and planning', icon: DollarSign, category: 'Finance' },
        { id: 'stock_market_analyzer', name: 'Stock Market Analyzer', description: 'Analyze stock market trends and make predictions', icon: LineChart, category: 'Finance' },
        { id: 'fraud_detection', name: 'Fraud Detection', description: 'Detect fraudulent financial activities and transactions', icon: Shield, category: 'Finance' },
        { id: 'credit_scoring', name: 'Credit Scoring & Loan Approval AI', description: 'Assess creditworthiness and loan approval potential', icon: CreditCard, category: 'Finance' },
        { id: 'debt_manager', name: 'Debt Manager', description: 'Manage and optimize debt repayment strategies', icon: Calculator, category: 'Finance' },
        { id: 'expense_tracker', name: 'Smart Expense Tracker', description: 'Track and categorize expenses with AI insights', icon: PieChart, category: 'Finance' },
      ]
    },
    {
      id: 'corporate',
      name: 'Corporate',
      agents: [
        { id: 'meeting_summarizer', name: 'Meeting Summarizer', description: 'Generate concise summaries of business meetings', icon: Brain, category: 'Corporate' },
        { id: 'task_scheduling', name: 'Task Scheduling', description: 'Optimize task scheduling for teams and projects', icon: Clock, category: 'Corporate' },
        { id: 'smart_email_manager', name: 'Smart Email Manager', description: 'Organize, prioritize, and respond to emails efficiently', icon: MailIcon, category: 'Corporate' },
        { id: 'report_generator', name: 'Report Generator', description: 'Generate comprehensive business reports automatically', icon: FileText, category: 'Corporate' },
        { id: 'strategy_recommender', name: 'Business Strategy Recommender', description: 'Generate data-driven business strategy recommendations', icon: Building2, category: 'Corporate' },
      ]
    }
  ];

  // Filter agents based on selected category
  const filteredAgents = selectedCategory 
    ? agentCategories.find(cat => cat.id === selectedCategory)?.agents || []
    : agentCategories.flatMap(category => category.agents);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);

  // Get current page agents
  const currentAgents = filteredAgents.slice(
    currentPage * agentsPerPage, 
    (currentPage + 1) * agentsPerPage
  );

  // Handle page navigation
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Map category to color
  const categoryColors: Record<string, string> = {
    'Marketing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Education': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Finance': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'Corporate': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'General': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  };

  // Map category to icon background color
  const iconColors: Record<string, string> = {
    'Marketing': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    'Education': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    'Finance': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    'Corporate': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    'General': 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Agents</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Browse our collection of AI agents organized by workflow category
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setCurrentPage(0);
          }}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !selectedCategory
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          )}
        >
          All Categories
        </button>
        {agentCategories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setCurrentPage(0);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedCategory === category.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {currentAgents.map(agent => (
          <div 
            key={agent.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center",
                  iconColors[agent.category] || iconColors.General
                )}>
                  <agent.icon className="h-6 w-6" />
                </div>
                <span className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full",
                  categoryColors[agent.category] || categoryColors.General
                )}>
                  {agent.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {agent.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {agent.description}
              </p>
              <button
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {currentPage * agentsPerPage + 1} to {Math.min((currentPage + 1) * agentsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentPage === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentPage >= totalPages - 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage; 