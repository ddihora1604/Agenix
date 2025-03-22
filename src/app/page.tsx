'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full flex items-center justify-center overflow-hidden">
      {/* Background with AI agent themed graphics */}
      <div className="absolute inset-0 z-0 w-full">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"></div>
        
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 w-full h-full bg-grid-white/10 dark:bg-grid-dark/20"></div>
        
        {/* AI agent icon decorations - positioned randomly */}
        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 bg-blue-100 dark:bg-blue-900/50 w-40 h-40 rounded-3xl rotate-12 animate-float opacity-70 shadow-lg"></div>
        <div className="absolute top-2/3 left-3/4 transform -translate-x-1/2 -translate-y-1/2 bg-purple-100 dark:bg-purple-900/50 w-32 h-32 rounded-3xl -rotate-6 animate-float-delayed opacity-70 shadow-lg"></div>
        <div className="absolute top-3/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2 bg-pink-100 dark:bg-pink-900/50 w-28 h-28 rounded-3xl rotate-3 animate-float opacity-70 shadow-lg"></div>
        
        {/* More decorative elements for better coverage */}
        <div className="absolute top-1/3 right-1/4 transform translate-x-1/2 -translate-y-1/2 bg-indigo-100 dark:bg-indigo-900/50 w-36 h-36 rounded-3xl rotate-12 animate-float-delayed opacity-70 shadow-lg"></div>
        <div className="absolute bottom-1/4 right-1/3 transform translate-x-1/2 translate-y-1/2 bg-blue-100 dark:bg-blue-900/50 w-24 h-24 rounded-3xl -rotate-12 animate-float opacity-70 shadow-lg"></div>
        
        {/* Blurred circles */}
        <div className="absolute top-10 right-[5%] w-72 h-72 bg-blue-500/30 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-[5%] w-96 h-96 bg-purple-500/30 dark:bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        {/* Circuit-like patterns */}
        <div className="absolute inset-0 w-full h-full bg-circuit-pattern opacity-10 dark:opacity-5"></div>
      </div>
      
      {/* Content container */}
      <div className="relative z-10 text-center max-w-4xl px-6 py-16 w-full mx-auto">
        <h1 className="font-manrope text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 dark:from-blue-400 dark:via-violet-400 dark:to-indigo-400 mb-6">
          AI Agent Marketplace
        </h1>
        
        <p className="text-gray-700 dark:text-gray-300 text-xl md:text-2xl font-light mb-12 max-w-3xl mx-auto">
          Discover, configure, and deploy powerful AI agents to automate your workflows and supercharge your productivity
        </p>
        
        <Link href="/dashboard" className="group inline-block">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
            Build Your AI Agents Workflow
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </Link>
        
        {/* Feature highlights */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-xl backdrop-blur-sm shadow-lg">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">Powerful AI Agents</h3>
            <p className="text-gray-600 dark:text-gray-400">Access specialized agents for marketing, education, finance, and more</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-xl backdrop-blur-sm shadow-lg">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">Custom Workflows</h3>
            <p className="text-gray-600 dark:text-gray-400">Build and customize your own AI agent workflows for any task</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-xl backdrop-blur-sm shadow-lg">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">Seamless Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">Integrate with your existing tools and platforms effortlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
}