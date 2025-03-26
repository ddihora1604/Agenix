'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ArrowRight, ChevronRight, ChevronLeft, Users, Image, ShoppingCart, 
  Youtube, Mail, BookOpen, Music, Palette, Presentation, FileCheck,
  Lightbulb, Globe, Pencil, GanttChart, FileAudio, Instagram, BarChart2,
  Check, Target, ShoppingBag, TrendingUp, FileEdit, BarChart, Calendar,
  Search, Book, FileText, PenTool, Briefcase, Brain, Building2, DollarSign,
  CreditCard, Shield, Calculator, PieChart, Mail as MailIcon, Clock, LineChart,
  Scale, Rocket, X, Download, Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSidebarState } from '@/hooks/use-sidebar-state';

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

// For calculating semantic search similarity
function calculateSimilarity(text1: string, text2: string): number {
  const text1Lower = text1.toLowerCase();
  const text2Lower = text2.toLowerCase();
  
  // Split into words
  const words1 = text1Lower.split(/\W+/).filter(word => word.length > 2);
  const words2 = text2Lower.split(/\W+/).filter(word => word.length > 2);
  
  // Calculate term frequency
  const tf1: Record<string, number> = {};
  const tf2: Record<string, number> = {};
  
  words1.forEach(word => {
    tf1[word] = (tf1[word] || 0) + 1;
  });
  
  words2.forEach(word => {
    tf2[word] = (tf2[word] || 0) + 1;
  });
  
  // Get unique words from both texts
  const uniqueWords = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  
  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  uniqueWords.forEach(word => {
    const freq1 = tf1[word] || 0;
    const freq2 = tf2[word] || 0;
    
    dotProduct += freq1 * freq2;
    magnitude1 += freq1 * freq1;
    magnitude2 += freq2 * freq2;
  });
  
  // Handle edge case
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  // Return cosine similarity
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

// Function to debounce search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Function to highlight matched text in a string
function highlightMatches(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;
  
  const queryTerms = query.toLowerCase().split(/\W+/).filter(term => term.length > 1);
  if (queryTerms.length === 0) return <>{text}</>;
  
  const regex = new RegExp(`(${queryTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        // Check if this part matches any of the query terms (case insensitive)
        const isMatch = queryTerms.some(term => 
          part.toLowerCase() === term.toLowerCase()
        );
        
        return isMatch ? 
          <span key={i} className="bg-yellow-100 dark:bg-yellow-900/30 font-medium">{part}</span> : 
          <span key={i}>{part}</span>;
      })}
    </>
  );
}

// Function to rank agents by search query
function rankAgentsBySearch(agents: Agent[], searchQuery: string): Agent[] {
  if (!searchQuery.trim()) return agents;
  
  // For better partial matching
  const queryTerms = searchQuery.toLowerCase().split(/\W+/).filter(term => term.length > 1);
  
  return [...agents].sort((a, b) => {
    const textA = `${a.name} ${a.description} ${a.category}`;
    const textB = `${b.name} ${b.description} ${b.category}`;
    
    // Calculate semantic similarity
    const similarityA = calculateSimilarity(textA, searchQuery);
    const similarityB = calculateSimilarity(textB, searchQuery);
    
    // Check for direct partial matches
    const textALower = textA.toLowerCase();
    const textBLower = textB.toLowerCase();
    
    // Add extra weight for exact matches in name or description
    let bonusA = 0;
    let bonusB = 0;
    
    // Name exact match is a strong signal
    if (a.name.toLowerCase().includes(searchQuery.toLowerCase())) bonusA += 0.5;
    if (b.name.toLowerCase().includes(searchQuery.toLowerCase())) bonusB += 0.5;
    
    // Partial term matching
    for (const term of queryTerms) {
      if (textALower.includes(term)) bonusA += 0.1;
      if (textBLower.includes(term)) bonusB += 0.1;
    }
    
    // Return combined score
    return (similarityB + bonusB) - (similarityA + bonusA);
  }).filter(agent => {
    const text = `${agent.name} ${agent.description} ${agent.category}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    // Check for any term match for more lenient filtering
    const hasTermMatch = queryTerms.some(term => text.includes(term));
    
    // Only keep results with some relevance
    const similarity = calculateSimilarity(text, query);
    return similarity > 0 || text.includes(query) || hasTermMatch;
  });
}

// Function to generate agent template file content
function generateAgentFileContent(agent: Agent): string {
  // Create a JSON representation of the agent with additional template fields
  const agentTemplate = {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    version: "1.0.0",
    configurable: true,
    customization: {
      parameters: [
        { name: "param1", type: "string", default: "", description: "First parameter for customization" },
        { name: "param2", type: "number", default: 0, description: "Second parameter for customization" }
      ],
      settings: {
        advanced: false,
        responseType: "json",
        maxTokens: 1000
      }
    },
    implementation: {
      // Include a code template for implementing the agent
      mainFunction: `
// Main implementation function for ${agent.name}
async function process(input) {
  // TODO: Implement your custom logic here
  
  // Example implementation
  const result = {
    success: true,
    agentName: "${agent.name}",
    output: "This is a template response from ${agent.name}. Replace with your implementation.",
    metadata: {
      processed: new Date().toISOString(),
      inputSize: JSON.stringify(input).length
    }
  };
  
  return result;
}
      `
    },
    // Instructions for usage
    documentation: {
      quickStart: `Quick start guide for ${agent.name}:\n1. Configure the agent parameters\n2. Implement the process function\n3. Test your implementation\n4. Deploy to your workflow`,
      examples: [`Example usage of ${agent.name} with sample input and output`]
    }
  };
  
  // Return pretty-printed JSON
  return JSON.stringify(agentTemplate, null, 2);
}

// Function to download agent file
function downloadAgentFile(agent: Agent) {
  // Generate file content
  const content = generateAgentFileContent(agent);
  
  // Create file name - convert to kebab case
  const fileName = `${agent.id.toLowerCase().replace(/_/g, '-')}-agent.json`;
  
  // Create a blob with the content
  const blob = new Blob([content], { type: 'application/json' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

const AgentsPage: React.FC = () => {
  const router = useRouter();
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const debouncedSearchQuery = useDebounce(searchInputValue, 300);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get the sidebar state
  const { setShowEmailGenerator, setShowDocumentSummarizer } = useSidebarState();
  
  // Update search query after debounce
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery]);
  
  const agentsPerPage = 9;

  // Define all agents with their categories and descriptions
  const agentCategories: Category[] = [
    {
      id: 'general',
      name: 'General',
      agents: [
        { id: 'professional_email_writer', name: 'Professional Email Writer', description: 'Craft professional business emails for various contexts', icon: Mail, category: 'General' },
        { id: 'user_persona_builder', name: 'Document Summarizer', description: 'Analyze and summarize documents, extracting key insights and information', icon: Users, category: 'General' },
        { id: 'image_generator', name: 'Image Generator', description: 'Generate creative images based on text descriptions', icon: Image, category: 'General' },
        { id: 'ecommerce_product_description', name: 'E-commerce Product Description Enhancer', description: 'Enhance product descriptions for better conversions', icon: ShoppingCart, category: 'General' },
        { id: 'youtube_summarizer', name: 'YouTube Video Summarizer', description: 'Create concise summaries of YouTube video content', icon: Youtube, category: 'General' },
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

  // Filter agents based on selected category and search query
  const filteredAgents = useMemo(() => {
    const categoryFiltered = selectedCategory 
      ? agentCategories.find(cat => cat.id === selectedCategory)?.agents || []
      : agentCategories.flatMap(category => category.agents);
    
    // Apply search if there's a query
    if (searchQuery.trim()) {
      return rankAgentsBySearch(categoryFiltered, searchQuery);
    }
    
    return categoryFiltered;
  }, [selectedCategory, searchQuery]);

  // Reset to first page when search or category changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory]);

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

  // Clear search query
  const clearSearch = () => {
    setSearchInputValue('');
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
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

  // Function to handle clicking on configure button
  const handleConfigureClick = (agentId: string) => {
    // Navigate to the specific agent page based on ID
    if (agentId === 'professional_email_writer') {
      // Set the showEmailGenerator state to true before navigating
      setShowEmailGenerator(true);
      router.push('/agents/email-writer');
    } else if (agentId === 'user_persona_builder') {
      // Set the showDocumentSummarizer state to true before navigating
      setShowDocumentSummarizer(true);
      router.push('/agents/document-summarizer');
    } else {
      // For future implementations of other agents
      console.log(`Configure clicked for agent: ${agentId}`);
    }
  };

  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">
      <div className="flex items-center mb-6">
        <Box className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse our collection of AI agents organized by workflow category</h1>
      </div>
      
    

      {/* Search bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search for agents by name, description, or functionality..."
          value={searchInputValue}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 text-gray-900"
        />
        {searchInputValue && (
          <button 
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        )}
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

      {/* Search results info */}
      {searchQuery.trim() && (
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            {filteredAgents.length === 0
              ? "No agents found matching your search."
              : filteredAgents.length === 1
              ? "1 agent found matching your search."
              : `${filteredAgents.length} agents found matching your search.`}
            {searchQuery !== searchInputValue && <span className="ml-2 italic text-gray-500">(searching...)</span>}
          </p>
        </div>
      )}

      {/* No results message */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No agents found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            {searchQuery
              ? "We couldn't find any agents matching your search. Try different keywords or clear the search."
              : "No agents found in this category. Try selecting a different category."}
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        /* Agent grid */
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
                  {searchQuery ? highlightMatches(agent.name, searchQuery) : agent.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {searchQuery ? highlightMatches(agent.description, searchQuery) : agent.description}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfigureClick(agent.id)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Configure
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAgentFile(agent);
                    }}
                    title={`Download ${agent.name} template`}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
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
      )}
    </div>
  );
};

export default AgentsPage; 