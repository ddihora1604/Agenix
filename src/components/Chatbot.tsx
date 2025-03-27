'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import dynamic from 'next/dynamic';
import { geminiService } from '../lib/gemini-service';
import '../styles/blender-bg.css';
import ReactMarkdown from 'react-markdown';

// Dynamically import the 3D model component with no SSR to avoid hydration issues
const AIChatbotModel = dynamic(() => import('./AIChatbotModel'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
});

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const MarkdownRenderer = ({ children }: { children: string }) => (
  <div className="text-sm prose prose-invert max-w-none">
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
        ul: ({ node, ...props }) => <ul className="mb-2 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="mb-2 space-y-1 list-decimal pl-4" {...props} />,
        li: ({ node, ...props }) => <li className="ml-4" {...props} />,
        hr: () => <hr className="my-2 border-white/20" />,
        strong: ({ node, ...props }) => <strong className="text-blue-200" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

// Update the message rendering part in your existing Chatbot component
const MessageContent = ({ msg }: { msg: Message }) => (
  <div className="max-w-[80%] rounded-lg p-3">
    {msg.type === 'bot' ? (
      <MarkdownRenderer>{msg.content}</MarkdownRenderer>
    ) : (
      <p className="text-sm">{msg.content}</p>
    )}
    <span className="text-xs opacity-70 mt-1 block">
      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
);

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isModelAnimating, setIsModelAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add a welcome message when the chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: "Hello! I'm your AI assistant for this marketplace. I can help you explore AI agents, navigate the platform, or answer any questions you might have. How can I assist you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    setIsModelAnimating(true);

    try {
      // Get response from Gemini
      const response = await geminiService.sendMessage(message);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setIsModelAnimating(false), 1000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button with 3D Model */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-300",
          isOpen && "scale-0 opacity-0",
          "hover:scale-110"
        )}
      >
        <div className="w-full h-full absolute">
          <Suspense fallback={<MessageSquare className="w-6 h-6" />}>
            <AIChatbotModel isAnimating={true} />
          </Suspense>
        </div>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-96 overflow-hidden rounded-lg shadow-xl transition-all duration-300 transform",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        {/* Blender style background wrapper */}
        <div className="blender-bg blender-grid w-full h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-900/30 backdrop-blur-sm bg-blue-900/20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 relative">
                <Suspense fallback={<Bot className="w-6 h-6 text-blue-200" />}>
                  <AIChatbotModel isAnimating={isModelAnimating} />
                </Suspense>
              </div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 backdrop-blur-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <MessageContent msg={msg} />
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-blue-200">
                <div className="w-6 h-6 relative">
                  <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
                    <AIChatbotModel isAnimating={true} />
                  </Suspense>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-blue-900/30 p-4 backdrop-blur-md bg-blue-900/20">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-md border border-blue-900/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-200/70"
              />
              <button
                type="submit"
                disabled={isTyping}
                className={cn(
                  "px-4 py-2 bg-blue-600/80 text-white rounded-lg transition-colors backdrop-blur-sm",
                  isTyping ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700/80"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;