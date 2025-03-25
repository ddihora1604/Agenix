'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  MessageSquare,
  FileText,
  AlertCircle,
  Book,
  Video,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ExternalLink,
  Send,
  Check,
  X,
  PlusCircle,
  Info,
  Play,
  Lock,
  Settings,
  RefreshCw,
  Zap
} from 'lucide-react';

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedTroubleshooting, setExpandedTroubleshooting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('faqs');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Toggle FAQ expansion
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Toggle troubleshooting expansion
  const toggleTroubleshooting = (index: number) => {
    setExpandedTroubleshooting(expandedTroubleshooting === index ? null : index);
  };

  // Handle contact form changes
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to an API
    console.log('Submitting support request:', contactForm);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitStatus('success');
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'medium'
        });
      }, 3000);
    }, 1000);
  };

  // FAQs data
  const faqs = [
    {
      question: "How do I create a new marketing workflow?",
      answer: "To create a new marketing workflow, navigate to the Dashboard and select 'Marketing' from the workflow selector. You can then configure your workflow by either clicking the 'Configure' button on agent cards or dragging agents into the workflow area. Arrange agents in your desired execution order, click 'Launch Workflow', fill in the required information, and click 'Submit' to execute the workflow."
    },
    {
      question: "What's the difference between the marketing agents?",
      answer: "Each marketing agent serves a specific purpose: Competitor Watchdog analyzes competitor activities, Product Recommender provides AI-driven product suggestions, Trend Analyst identifies market trends, Content Creator generates marketing content, and Sales Strategist develops data-driven sales approaches. They can work together in sequence to create comprehensive marketing strategies."
    },
    {
      question: "Can I customize agent parameters?",
      answer: "Yes, you can customize agent parameters when configuring your workflow. After adding agents to your workflow, click 'Launch Workflow' to access the input form where you can provide specific parameters for each agent, such as target markets, competitors, product details, and more."
    },
    {
      question: "How do I save workflow results?",
      answer: "Workflow results are automatically displayed after execution. To save these results, you can use the 'Export Data' option in the Analytics & Data section of the Settings page. Additionally, you can enable the 'Save workflow execution history' option in Workflow Preferences to automatically store past workflow executions."
    },
    {
      question: "What happens if an agent fails during execution?",
      answer: "By default, if an agent fails during execution, the workflow will stop and display an error message. In the Settings page, you can enable 'Retry failed executions automatically' and set the number of retries under Execution Parameters to make the system automatically attempt to recover from failures."
    },
    {
      question: "Can I run multiple workflows simultaneously?",
      answer: "Yes, you can have multiple workflows configured and run them independently. Each workflow execution is processed separately. For advanced users, enabling 'Parallel agent execution' in the Agent Management settings allows specific agents within a workflow to run concurrently when possible."
    }
  ];

  // Troubleshooting guides data
  const troubleshootingGuides = [
    {
      problem: "Workflow execution fails immediately",
      steps: [
        "Check your internet connection to ensure the system can communicate with the backend services.",
        "Verify that you've provided all required inputs for each agent in your workflow.",
        "Check the Agent Management settings to ensure your timeout values aren't set too low.",
        "Try refreshing the page and attempting the workflow execution again.",
        "If the problem persists, try creating a new workflow from scratch."
      ]
    },
    {
      problem: "Agent results are incomplete or unexpected",
      steps: [
        "Review the input data you've provided to ensure it's accurate and comprehensive.",
        "Check if the agent has sufficient context from previous agents in the workflow sequence.",
        "Adjust the max retries settings in Execution Parameters to allow more attempts.",
        "Try adding more specific details in your input fields for better results.",
        "Consider rearranging the workflow sequence to provide better context flow between agents."
      ]
    },
    {
      problem: "UI appears broken or displays incorrectly",
      steps: [
        "Try switching between dark and light modes to see if the issue resolves.",
        "Clear your browser cache and reload the application.",
        "Ensure your browser is updated to the latest version.",
        "Disable any browser extensions that might interfere with the application.",
        "Try accessing the application from a different browser or device."
      ]
    },
    {
      problem: "Settings are not saving correctly",
      steps: [
        "Ensure you're clicking the 'Save Settings' button after making changes.",
        "Check your browser's local storage permissions for the site.",
        "Try using a different browser to rule out browser-specific issues.",
        "Clear your browser cache and cookies, then try again.",
        "If using account-based settings, try logging out and back in again."
      ]
    },
    {
      problem: "Cannot add more than one agent to workflow",
      steps: [
        "Check the 'Max Agents Per Workflow' setting in Agent Management to ensure it's not set to 1.",
        "Make sure you're not trying to add the same agent twice (each agent can only be added once).",
        "Ensure you're correctly using the 'Configure' button or drag-and-drop functionality.",
        "Try refreshing the page and starting a new workflow.",
        "Check your browser console for any error messages that might indicate the problem."
      ]
    }
  ];

  // Tutorial resources data
  const tutorialResources = [
    {
      title: "Getting Started with Marketing Agents",
      type: "video",
      url: "#",
      description: "A comprehensive introduction to setting up and using marketing agents for your first workflow."
    },
    {
      title: "Advanced Workflow Configurations",
      type: "documentation",
      url: "#",
      description: "Learn how to create sophisticated multi-agent workflows with custom parameters and sequential execution."
    },
    {
      title: "Optimizing Agent Parameters",
      type: "video",
      url: "#",
      description: "Discover the best practices for configuring agent parameters to get the most relevant and useful results."
    },
    {
      title: "Marketing Analytics Integration Guide",
      type: "documentation",
      url: "#",
      description: "Detailed instructions for leveraging the analytics from your marketing agent workflows."
    },
    {
      title: "Troubleshooting Common Issues",
      type: "documentation",
      url: "#",
      description: "A comprehensive guide to resolving frequent problems encountered when using marketing agents."
    },
    {
      title: "Workflow Templates and Examples",
      type: "video",
      url: "#",
      description: "Walk through pre-built templates and real-world examples of effective marketing agent workflows."
    }
  ];

  // Helper for search filtering
  const applySearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Filtered FAQs based on search
  const filteredFaqs = faqs.filter(
    faq => applySearch(faq.question) || applySearch(faq.answer)
  );

  // Filtered troubleshooting guides based on search
  const filteredTroubleshooting = troubleshootingGuides.filter(
    guide => applySearch(guide.problem) || guide.steps.some(step => applySearch(step))
  );

  // Filtered resources based on search
  const filteredResources = tutorialResources.filter(
    resource => applySearch(resource.title) || applySearch(resource.description)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <HelpCircle className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search for help topics, FAQs, or troubleshooting guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100 text-gray-900"
        />
      </div>

      {/* Quick Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => setActiveTab('faqs')}
          className={`cursor-pointer rounded-xl p-5 shadow-sm border transition-colors ${
            activeTab === 'faqs' 
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              activeTab === 'faqs' ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <MessageSquare className={`h-6 w-6 ${
                activeTab === 'faqs' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div className="ml-4">
              <h3 className={`font-medium ${
                activeTab === 'faqs' ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
              }`}>Frequently Asked Questions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Common questions and answers</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('troubleshooting')}
          className={`cursor-pointer rounded-xl p-5 shadow-sm border transition-colors ${
            activeTab === 'troubleshooting' 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              activeTab === 'troubleshooting' ? 'bg-red-100 dark:bg-red-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <AlertCircle className={`h-6 w-6 ${
                activeTab === 'troubleshooting' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div className="ml-4">
              <h3 className={`font-medium ${
                activeTab === 'troubleshooting' ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'
              }`}>Troubleshooting</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Solutions to common problems</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('contact')}
          className={`cursor-pointer rounded-xl p-5 shadow-sm border transition-colors ${
            activeTab === 'contact' 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              activeTab === 'contact' ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Mail className={`h-6 w-6 ${
                activeTab === 'contact' ? 'text-blue-400 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div className="ml-4">
              <h3 className={`font-medium ${
                activeTab === 'contact' ? 'text-blue-500 dark:text-blue-300' : 'text-gray-900 dark:text-white'
              }`}>Contact Support</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get personalized assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* FAQs Section */}
        {activeTab === 'faqs' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Frequently Asked Questions
            </h2>
            
            {searchQuery && filteredFaqs.length === 0 ? (
              <div className="text-center py-10">
                <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No matching FAQs found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms or explore other categories</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div 
                    key={index}
                    className={`border ${
                      expandedFaq === index 
                        ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10' 
                        : 'border-gray-200 dark:border-gray-700'
                    } rounded-lg overflow-hidden transition-colors duration-200`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="flex justify-between items-center w-full p-4 text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                    
                    {expandedFaq === index && (
                      <div className="px-4 pb-4 text-gray-600 dark:text-gray-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Troubleshooting Section */}
        {activeTab === 'troubleshooting' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
              Troubleshooting Guides
            </h2>
            
            {searchQuery && filteredTroubleshooting.length === 0 ? (
              <div className="text-center py-10">
                <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No matching troubleshooting guides found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms or explore other categories</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTroubleshooting.map((guide, index) => (
                  <div 
                    key={index}
                    className={`border ${
                      expandedTroubleshooting === index 
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' 
                        : 'border-gray-200 dark:border-gray-700'
                    } rounded-lg overflow-hidden transition-colors duration-200`}
                  >
                    <button
                      onClick={() => toggleTroubleshooting(index)}
                      className="flex justify-between items-center w-full p-4 text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{guide.problem}</span>
                      {expandedTroubleshooting === index ? (
                        <ChevronUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                    
                    {expandedTroubleshooting === index && (
                      <div className="px-4 pb-4">
                        <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                          {guide.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="pl-2">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Support Section */}
        {activeTab === 'contact' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Contact Support
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {submitStatus === 'success' ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 text-center">
                    <Check className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Support Request Sent</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Thank you for reaching out. Our support team will respond to your inquiry within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitStatus('idle')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={contactForm.name}
                          onChange={handleContactChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={contactForm.email}
                          onChange={handleContactChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={contactForm.subject}
                        onChange={handleContactChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={contactForm.priority}
                        onChange={handleContactChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="low">Low - General question</option>
                        <option value="medium">Medium - Need assistance</option>
                        <option value="high">High - Workflow issue</option>
                        <option value="urgent">Urgent - System down</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={contactForm.message}
                        onChange={handleContactChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Support Request
                      </button>
                    </div>
                  </form>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Other Ways to Reach Us</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Support</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        support@marketingai.example.com
                      </p>
                      <p className="text-xs text-gray-500">Response within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Phone Support</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        +1 (555) 123-4567
                      </p>
                      <p className="text-xs text-gray-500">Mon-Fri: 9AM-5PM EST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Live Chat</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Chat with our support team
                      </p>
                      <button className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 mt-1">
                        Start Chat →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resources Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Book className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          Resources & Tutorials
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(searchQuery ? filteredResources : tutorialResources).map((resource, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-transform hover:translate-y-[-2px]"
            >
              <div className="flex items-center mb-3">
                {resource.type === 'video' ? (
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                    <Play className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {resource.type === 'video' ? 'Video Tutorial' : 'Documentation'}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{resource.description}</p>
              
              <a 
                href={resource.url}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {resource.type === 'video' ? 'Watch Video' : 'Read Documentation'}
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Help Section */}
      <div className="mt-10 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-400">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">New User Guide</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Just getting started? Our comprehensive guide will walk you through setting up your first marketing workflow.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Read the guide
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-400">
              <Zap className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quick Tips & Tricks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Discover time-saving shortcuts and expert techniques to maximize your productivity with marketing agents.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">
                View tips
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 