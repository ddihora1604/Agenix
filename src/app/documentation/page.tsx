'use client';

import React, { useState, useEffect } from 'react';
import { Book, Search, ChevronRight, Code, ExternalLink, Copy, Check, Terminal, BookOpen, MessageSquare, PackageOpen, Zap } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Agent categories and their agents
const agentCategories = [
  {
    id: 'general',
    name: 'General Independent Agents',
    icon: PackageOpen,
    agents: [
      { id: 'user_persona_builder', name: 'User Persona Builder' },
      { id: 'image_generator', name: 'Image Generator' },
      { id: 'ecommerce_description', name: 'E-commerce Product Description Enhancer' },
      { id: 'youtube_summarizer', name: 'YouTube Video Summarizer' },
      { id: 'professional_email', name: 'Professional Email Writer' },
      { id: 'story_maker', name: 'Story Maker' },
      { id: 'youtube_to_mp3', name: 'YouTube Video to MP3 Converter' },
      { id: 'logo_generator', name: 'Logo Generator' },
      { id: 'ppt_maker', name: 'PPT Maker' },
      { id: 'resume_filtering', name: 'Resume Filtering' },
      { id: 'prompt_writer', name: 'Prompt Writer' },
      { id: 'language_translator', name: 'Language Translator' },
      { id: 'blog_writer', name: 'Blog Writer' },
      { id: 'web_scraper', name: 'Web Scraper' },
      { id: 'audio_video_generation', name: 'Audio-Video Generation' },
      { id: 'social_media_scraper', name: 'Social Media Scraper' },
      { id: 'statistical_analysis', name: 'Statistical Analysis Agent' },
      { id: 'plagiarism_checker', name: 'Plagiarism & Grammar Checker' },
    ]
  },
  {
    id: 'education',
    name: 'Education Workflow',
    icon: BookOpen,
    agents: [
      { id: 'qa_chatbot', name: 'Q&A Chatbot for Students' },
      { id: 'textbook_summarizer', name: 'Textbook Summarizer' },
      { id: 'essay_maker', name: 'Essay and Story Maker' },
      { id: 'quiz_generator', name: 'Personalized Quiz Generator' },
      { id: 'notes_generator', name: 'Notes Generator' },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing Workflow',
    icon: Zap,
    agents: [
      { id: 'competitor_watchdog', name: 'Competitor Watchdog' },
      { id: 'product_recommendation', name: 'Product Recommendation' },
      { id: 'trend_finder', name: 'Trend Finder' },
      { id: 'post_creator', name: 'Post Creator' },
      { id: 'sales_pitch', name: 'Sales Pitch' },
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate Productivity',
    icon: MessageSquare,
    agents: [
      { id: 'meeting_summarizer', name: 'Meeting Summarizer' },
      { id: 'task_scheduling', name: 'Task Scheduling' },
      { id: 'smart_email_manager', name: 'Smart Email Manager' },
      { id: 'report_generator', name: 'Report Generator' },
      { id: 'strategy_recommender', name: 'Business Strategy Recommender' },
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: Zap,
    agents: [
      { id: 'finance_advisor', name: 'AI-Powered Personal Finance Advisor' },
      { id: 'stock_analyzer', name: 'Stock Market Analyzer' },
      { id: 'fraud_detection', name: 'Fraud Detection' },
      { id: 'credit_scoring', name: 'Credit Scoring & Loan Approval AI' },
      { id: 'debt_manager', name: 'Debt Manager' },
      { id: 'expense_tracker', name: 'Smart Expense Tracker' },
    ]
  }
];

// Define the documentation content for each agent
const agentDocs = {
  // General Independent Agents
  user_persona_builder: {
    title: 'User Persona Builder',
    description: 'An AI-powered tool that generates detailed, realistic user personas based on input data such as target demographics, behaviors, and preferences.',
    useCases: [
      'Marketing campaign planning',
      'Product design and development',
      'User experience research',
      'Target audience analysis',
      'Content strategy development'
    ],
    implementation: `The User Persona Builder analyzes input data using natural language processing to identify patterns and create comprehensive user profiles. It combines demographic information with behavioral insights to generate personas that include goals, pain points, motivations, and decision-making factors.`,
    apiReference: [
      {
        endpoint: '/api/agents/persona-builder',
        method: 'POST',
        description: 'Generates a user persona based on provided data',
        requestParams: [
          { name: 'demographics', type: 'object', description: 'Age, location, gender, income, etc.' },
          { name: 'behaviors', type: 'array', description: 'Online activities, shopping habits, etc.' },
          { name: 'preferences', type: 'array', description: 'Brand preferences, product interests, etc.' },
          { name: 'goals', type: 'array', description: 'Personal and professional objectives' }
        ],
        responseFormat: 'Returns a JSON object containing the complete user persona'
      }
    ],
    codeSnippets: [
      {
        language: 'javascript',
        label: 'JavaScript/Node.js',
        code: `const axios = require('axios');

async function generateUserPersona() {
  try {
    const response = await axios.post('https://api.aiagents.com/persona-builder', {
      demographics: {
        ageRange: '25-34',
        location: 'Urban',
        gender: 'Female',
        income: 'Middle-high',
        education: 'Bachelor degree'
      },
      behaviors: [
        'Shops online 2-3 times per week',
        'Active on Instagram and TikTok',
        'Uses mobile devices for most online activities'
      ],
      preferences: [
        'Prefers sustainable brands',
        'Values quality over price',
        'Early adopter of new technologies'
      ],
      goals: [
        'Career advancement',
        'Work-life balance',
        'Building social connections'
      ]
    });
    
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating persona:', error);
  }
}

// Call the function
generateUserPersona();`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests
import json

def generate_user_persona():
    try:
        url = "https://api.aiagents.com/persona-builder"
        
        payload = {
            "demographics": {
                "ageRange": "25-34",
                "location": "Urban",
                "gender": "Female",
                "income": "Middle-high",
                "education": "Bachelor degree"
            },
            "behaviors": [
                "Shops online 2-3 times per week",
                "Active on Instagram and TikTok",
                "Uses mobile devices for most online activities"
            ],
            "preferences": [
                "Prefers sustainable brands",
                "Values quality over price",
                "Early adopter of new technologies"
            ],
            "goals": [
                "Career advancement",
                "Work-life balance",
                "Building social connections"
            ]
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error generating persona: {e}")
        return None

# Call the function
persona = generate_user_persona()
print(persona)`
      }
    ],
    externalResources: [
      {
        title: 'User Persona Best Practices',
        url: 'https://example.com/user-persona-best-practices',
        description: 'Learn about effective ways to utilize user personas in your product development'
      },
      {
        title: 'Persona Builder API Documentation',
        url: 'https://example.com/persona-builder-api',
        description: 'Full API reference for the User Persona Builder'
      }
    ]
  },
  
  image_generator: {
    title: 'Image Generator',
    description: 'A powerful AI-based tool for generating images from text prompts using advanced machine learning models like DALL-E, Stable Diffusion, or Midjourney.',
    useCases: [
      'Content creation for marketing materials',
      'Visualization of concepts for presentations',
      'Rapid prototyping for design projects',
      'Custom illustrations for websites and apps',
      'Creative inspiration for artists and designers'
    ],
    implementation: `The Image Generator uses state-of-the-art text-to-image generation models. It interprets the text prompt to understand the subject, style, composition, and other visual elements before generating high-quality images that match the description.`,
    apiReference: [
      {
        endpoint: '/api/agents/image-generator',
        method: 'POST',
        description: 'Generates images based on text prompts',
        requestParams: [
          { name: 'prompt', type: 'string', description: 'Detailed text description of the desired image' },
          { name: 'model', type: 'string', description: 'AI model to use (e.g., "dalle", "stable-diffusion")' },
          { name: 'count', type: 'number', description: 'Number of images to generate (1-4)' },
          { name: 'size', type: 'string', description: 'Image dimensions (e.g., "512x512", "1024x1024")' },
          { name: 'style', type: 'string', description: 'Optional style parameter (e.g., "photorealistic", "cartoon")' }
        ],
        responseFormat: 'Returns an array of image URLs or base64-encoded image data'
      }
    ],
    codeSnippets: [
      {
        language: 'javascript',
        label: 'JavaScript/Node.js',
        code: `const axios = require('axios');

async function generateImage() {
  try {
    const response = await axios.post('https://api.aiagents.com/image-generator', {
      prompt: 'A futuristic city with flying cars and neon lights at sunset',
      model: 'stable-diffusion',
      count: 2,
      size: '1024x1024',
      style: 'photorealistic'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY'
      }
    });
    
    // Handle the generated images
    const images = response.data.images;
    console.log(\`Generated \${images.length} images:\`);
    images.forEach((img, index) => {
      console.log(\`Image \${index + 1}: \${img.url}\`);
    });
    
    return images;
  } catch (error) {
    console.error('Error generating images:', error);
  }
}

// Call the function
generateImage();`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

def generate_image():
    try:
        url = "https://api.aiagents.com/image-generator"
        
        payload = {
            "prompt": "A futuristic city with flying cars and neon lights at sunset",
            "model": "stable-diffusion",
            "count": 2,
            "size": "1024x1024",
            "style": "photorealistic"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_API_KEY"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        images = result.get("images", [])
        
        print(f"Generated {len(images)} images:")
        for i, img in enumerate(images):
            print(f"Image {i+1}: {img['url']}")
        
        return images
    except requests.exceptions.RequestException as e:
        print(f"Error generating images: {e}")
        return None

# Call the function
generate_image()`
      }
    ],
    externalResources: [
      {
        title: 'Effective Prompt Engineering',
        url: 'https://example.com/prompt-engineering-guide',
        description: 'Learn how to craft effective prompts for better image generation results'
      },
      {
        title: 'Image Generator API Documentation',
        url: 'https://example.com/image-generator-api',
        description: 'Full API reference for the Image Generator'
      },
      {
        title: 'Best Practices for AI Image Generation',
        url: 'https://example.com/ai-image-best-practices',
        description: 'Guidelines and tips for generating high-quality AI images'
      }
    ]
  },
  
  // Marketing Workflow
  competitor_watchdog: {
    title: 'Competitor Watchdog',
    description: 'An AI agent that monitors and analyzes competitor activities in real-time, tracking their marketing strategies, pricing changes, product updates, and market positioning.',
    useCases: [
      'Competitive intelligence gathering',
      'Market positioning analysis',
      'Identifying market gaps and opportunities',
      'Tracking competitor product launches',
      'Monitoring pricing strategies'
    ],
    implementation: `The Competitor Watchdog uses web scraping, natural language processing, and data analysis techniques to collect and analyze information about competitors. It monitors websites, social media, news sources, and other public channels to provide actionable insights about competitor activities.`,
    apiReference: [
      {
        endpoint: '/api/marketing/competitor-watchdog',
        method: 'POST',
        description: 'Analyzes competitor activities based on provided parameters',
        requestParams: [
          { name: 'competitors', type: 'array', description: 'List of competitor names or URLs' },
          { name: 'market', type: 'string', description: 'Target market segment to analyze' },
          { name: 'metrics', type: 'array', description: 'Specific metrics to track (e.g., "pricing", "social_media")' },
          { name: 'timeframe', type: 'string', description: 'Analysis timeframe (e.g., "last_week", "last_month")' }
        ],
        responseFormat: 'Returns a comprehensive competitive analysis report'
      }
    ],
    codeSnippets: [
      {
        language: 'javascript',
        label: 'JavaScript/Node.js',
        code: `const axios = require('axios');

async function analyzeCompetitors() {
  try {
    const response = await axios.post('https://api.aiagents.com/marketing/competitor-watchdog', {
      competitors: [
        'competitor1.com',
        'competitor2.com',
        'competitor3.com'
      ],
      market: 'B2B SaaS',
      metrics: [
        'pricing',
        'product_features',
        'marketing_messaging',
        'social_media_presence'
      ],
      timeframe: 'last_month'
    });
    
    console.log('Competitor Analysis Report:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error analyzing competitors:', error);
  }
}

// Call the function
analyzeCompetitors();`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests
import json

def analyze_competitors():
    try:
        url = "https://api.aiagents.com/marketing/competitor-watchdog"
        
        payload = {
            "competitors": [
                "competitor1.com",
                "competitor2.com",
                "competitor3.com"
            ],
            "market": "B2B SaaS",
            "metrics": [
                "pricing",
                "product_features",
                "marketing_messaging",
                "social_media_presence"
            ],
            "timeframe": "last_month"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_API_KEY"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        print("Competitor Analysis Report:")
        print(json.dumps(result, indent=2))
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error analyzing competitors: {e}")
        return None

# Call the function
analyze_competitors()`
      }
    ],
    externalResources: [
      {
        title: 'Competitive Intelligence Guide',
        url: 'https://example.com/competitive-intelligence-guide',
        description: 'Comprehensive guide to leveraging competitive intelligence in your marketing strategy'
      },
      {
        title: 'Competitor Watchdog API Documentation',
        url: 'https://example.com/competitor-watchdog-api',
        description: 'Complete API reference for the Competitor Watchdog agent'
      }
    ]
  },
};

// More agent documentation to be added

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedAgent, setSelectedAgent] = useState('user_persona_builder');
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);

  // Filter agents based on search query
  const filteredCategories = agentCategories.map(category => {
    const filteredAgents = category.agents.filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, agents: filteredAgents };
  }).filter(category => category.agents.length > 0);

  // Handle agent selection
  const handleAgentSelect = (categoryId: string, agentId: string) => {
    setSelectedCategory(categoryId);
    setSelectedAgent(agentId);
    setActiveTab('overview');
  };

  // Handle code copying
  const handleCopyCode = (index: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(index);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Get current agent documentation
  const currentAgent = agentDocs[selectedAgent as keyof typeof agentDocs];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-8">
        <Book className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documentation</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search for agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100 text-gray-900"
        />
      </div>

      <div className="flex flex-col md:flex-row h-full bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <nav className="p-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="mb-4">
                <div className="flex items-center mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.name}
                </div>
                <ul className="space-y-1">
                  {category.agents.map((agent) => (
                    <li key={agent.id}>
                      <button
                        onClick={() => handleAgentSelect(category.id, agent.id)}
                        className={`flex items-center w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedAgent === agent.id
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${
                          selectedAgent === agent.id ? 'rotate-90' : ''
                        }`} />
                        {agent.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentAgent ? (
            <>
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentAgent.title}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{currentAgent.description}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'api'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  API Reference
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'code'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Code Examples
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'resources'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Resources
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">{currentAgent.description}</p>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Use Cases</h3>
                  <ul className="list-disc pl-5 mb-6 text-gray-700 dark:text-gray-300">
                    {currentAgent.useCases.map((useCase, index) => (
                      <li key={index} className="mb-1">{useCase}</li>
                    ))}
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Implementation Details</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">{currentAgent.implementation}</p>
                </div>
              )}

              {activeTab === 'api' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Reference</h3>
                  
                  {currentAgent.apiReference.map((api, index) => (
                    <div key={index} className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-3">
                        <Terminal className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">{api.endpoint}</h4>
                      </div>
                      
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-md">
                          {api.method}
                        </span>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{api.description}</span>
                      </div>
                      
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Request Parameters:</h5>
                      <ul className="mb-4 pl-5">
                        {api.requestParams.map((param, paramIndex) => (
                          <li key={paramIndex} className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{param.name}</span>
                            <span className="text-gray-500 dark:text-gray-500 ml-1">({param.type})</span>: {param.description}
                          </li>
                        ))}
                      </ul>
                      
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Response Format:</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{api.responseFormat}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'code' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Code Examples</h3>
                  
                  {currentAgent.codeSnippets.map((snippet, index) => (
                    <div key={index} className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">{snippet.label}</h4>
                        <button
                          onClick={() => handleCopyCode(index, snippet.code)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center text-sm"
                        >
                          {copiedSnippet === index ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden">
                        <SyntaxHighlighter
                          language={snippet.language}
                          style={atomDark}
                          customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                        >
                          {snippet.code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'resources' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">External Resources</h3>
                  
                  <div className="space-y-4">
                    {currentAgent.externalResources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">{resource.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Documentation Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                The documentation for this agent is currently being developed. Please check back later or select another agent from the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage; 