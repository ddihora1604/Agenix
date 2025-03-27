'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowRight, Cpu, Zap, Link2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1.0] 
      }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };
  
  // Scroll to content function
  const scrollToContent = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Advanced background with enhanced visual elements */}
      <div className="absolute inset-0 z-0 w-full overflow-hidden">
        {/* Primary gradient background with improved color transition */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-indigo-500/5 via-purple-500/3 to-blue-500/7 dark:from-indigo-600/10 dark:via-purple-600/8 dark:to-blue-600/15"></div>
        
        {/* Subtle dotted pattern overlay */}
        <div className="absolute inset-0 w-full h-full bg-dot-pattern opacity-5 dark:opacity-10"></div>
        
        {/* Refined grid pattern with smoother animation */}
        <div className="absolute inset-0 w-full h-full bg-grid-white/2 dark:bg-grid-dark/3 animate-[pulse_40s_ease-in-out_infinite]"></div>
        
        {/* Subtle radial gradient background for added depth */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-blue-500/3 dark:to-blue-600/5 opacity-70"></div>
        
        {/* Enhanced floating decorative elements with improved gradients and positioning */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-[8%] left-[12%] bg-gradient-to-br from-blue-200/15 via-blue-300/10 to-blue-100/5 dark:from-blue-800/15 dark:via-blue-700/10 dark:to-blue-900/5 w-80 h-80 rounded-full shadow-lg blur-3xl"
        ></motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2.2, ease: "easeOut", delay: 0.4 }}
          className="absolute bottom-[10%] right-[8%] bg-gradient-to-br from-violet-200/15 via-purple-300/10 to-purple-100/5 dark:from-violet-800/15 dark:via-purple-700/10 dark:to-purple-900/5 w-96 h-96 rounded-full shadow-lg blur-3xl"
        ></motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.8 }}
          className="absolute top-[45%] right-[18%] bg-gradient-to-br from-indigo-200/15 via-indigo-300/10 to-indigo-100/5 dark:from-indigo-800/15 dark:via-indigo-700/10 dark:to-indigo-900/5 w-88 h-88 rounded-full shadow-lg blur-3xl"
        ></motion.div>
        
        {/* Larger blurred gradient circles for depth and dimension */}
        <div className="absolute -top-[15%] left-[25%] w-[60rem] h-[60rem] bg-gradient-to-br from-blue-500/3 via-indigo-500/2 to-violet-500/1 dark:from-blue-600/4 dark:via-indigo-600/3 dark:to-violet-600/2 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[15%] right-[25%] w-[60rem] h-[60rem] bg-gradient-to-br from-violet-500/3 via-purple-500/2 to-pink-500/1 dark:from-violet-600/4 dark:via-purple-600/3 dark:to-pink-600/2 rounded-full blur-3xl"></div>
        
        {/* Animated floating light particles */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white dark:bg-blue-400"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3 + 0.1,
                }}
                animate={{
                  y: [0, Math.random() * -30 - 10, 0],
                  opacity: [Math.random() * 0.3 + 0.1, Math.random() * 0.5 + 0.3, Math.random() * 0.3 + 0.1],
                }}
                transition={{
                  duration: Math.random() * 5 + 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </motion.div>
        </div>
        
        {/* Subtle top lighting effect */}
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-400/10 dark:to-transparent"></div>
        
        {/* Very subtle circuit pattern for tech theme */}
        <div className="absolute inset-0 w-full h-full bg-circuit-pattern opacity-3 dark:opacity-5"></div>
      </div>
      
      {/* Full-width Hero section with properly spaced content */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-12 md:py-16">
        {/* Light glass effect overlay for content area */}
        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-[80vh] max-w-[95%] mx-auto rounded-[3rem] bg-white/5 dark:bg-gray-900/5 backdrop-blur-[2px] border border-white/10 dark:border-gray-800/10 z-[1]"></div>
        
        <div className="relative z-10 w-full max-w-[1800px] mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center justify-center text-center"
          >
            <motion.h1 
              variants={fadeInUp}
              className="font-manrope text-6xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-pink-500 to-indigo-600 dark:from-blue-400 dark:via-pink-400 dark:to-indigo-400 mb-8 md:mb-10 leading-tight"
            >
              Agenix
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-gray-700 dark:text-gray-300 text-xl md:text-2xl lg:text-3xl font-light mb-8 md:mb-10 max-w-4xl px-4"
            >
              AI Agent Marketplace for accessing & customizing independent modular AI Agents!
            </motion.p>
            
            {/* <motion.p 
              variants={fadeInUp}
              className="text-gray-600 dark:text-gray-400 text-lg md:text-xl mb-12 md:mb-16 max-w-3xl px-4"
            >
              Build Your Workflow with customizable AI agents designed for your specific business needs
            </motion.p> */}
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full max-w-xl mx-auto px-4"
            >
              <Link href="/dashboard" className="group flex-1">
                <button className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-pink-500 to-indigo-600 hover:from-blue-700 hover:via-pink-600 hover:to-indigo-700 dark:from-blue-500 dark:via-pink-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:via-pink-600 dark:hover:to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
                  Build Your AI Agents Workflow
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </Link>
              
              <Link href="/agents" className="group flex-1">
                <button className="w-full px-8 py-4 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800">
                  Explore Marketplace
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Enhanced Feature cards section with better spacing and contrast */}
      <section ref={scrollRef} className="relative w-full py-24 md:py-8 bg-gradient-to-b from-white/70 to-blue-50/50 dark:from-gray-900/70 dark:to-blue-950/40 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
          {/* <div className="text-center mb-20 md:mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 dark:from-blue-400 dark:via-violet-400 dark:to-indigo-400 mb-8"
            >
              Powerful AI Workflow Platform
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-gray-700 dark:text-gray-300 text-xl md:text-2xl max-w-4xl mx-auto px-4"
            >
              Everything you need to create, manage, and deploy intelligent AI agents
            </motion.p>
          </div> */}
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-1 lg:gap-12"
          >
            {/* Card 1 - Improved contrast and spacing */}
            <motion.div 
              variants={fadeInUp}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-2xl transform group-hover:scale-[1.03] transition-transform duration-300"></div>
              <div className="relative p-8 md:p-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/40 p-5 rounded-xl inline-flex mb-7 shadow-sm">
                  <Cpu className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-5">Powerful AI Agents</h3>
                <p className="text-gray-600 dark:text-gray-400 flex-grow text-lg">Access specialized agents for marketing, education, finance, and more to transform how you work. Each agent is designed to handle specific tasks with maximum efficiency.</p>
              </div>
            </motion.div>
            
            {/* Card 2 - Improved contrast and spacing */}
            <motion.div 
              variants={fadeInUp}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 to-purple-500/15 dark:from-violet-500/20 dark:to-purple-500/20 rounded-2xl transform group-hover:scale-[1.03] transition-transform duration-300"></div>
              <div className="relative p-8 md:p-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/40 p-5 rounded-xl inline-flex mb-7 shadow-sm">
                  <Zap className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-5">Custom Workflows</h3>
                <p className="text-gray-600 dark:text-gray-400 flex-grow text-lg">Build and customize your own AI agent workflows for any task with our intuitive drag-and-drop interface. Combine multiple agents for complex automation processes.</p>
              </div>
            </motion.div>
            
            {/* Card 3 - Updated to pink tones */}
            <motion.div 
              variants={fadeInUp}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 to-indigo-500/15 dark:from-pink-500/20 dark:to-indigo-500/20 rounded-2xl transform group-hover:scale-[1.03] transition-transform duration-300"></div>
              <div className="relative p-8 md:p-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/50 dark:to-pink-800/40 p-5 rounded-xl inline-flex mb-7 shadow-sm">
                  <Link2 className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-5">Seamless Integration</h3>
                <p className="text-gray-600 dark:text-gray-400 flex-grow text-lg">Integrate with your existing tools and platforms effortlessly to enhance your productivity ecosystem. Connect with hundreds of popular services through our API.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}