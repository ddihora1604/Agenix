'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, MapPin, Calendar, Briefcase, Building, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          {/* Profile panel */}
          <motion.div
            className="fixed top-0 right-0 h-screen w-80 bg-white dark:bg-gray-900 shadow-lg z-50 border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
          >
            {/* Header decoration */}
            <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600" />
            
            <div className="p-6 relative">
              {/* Profile image - positioned to overlap the header */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-4 border-white dark:border-gray-900 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  DD
                </div>
              </div>
              
              <div className="mt-5 text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Darshan Dihora</h2>
                <p className="text-blue-600 dark:text-blue-400">AI Enthusiast</p>
              </div>
              
              <button 
                onClick={onClose}
                className="absolute top-3 right-3 rounded-full p-1.5 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Profile Content */}
              <div className="space-y-0.3">
                <ProfileField 
                  icon={Mail} 
                  label="Email" 
                  value="darshan.dihora@djsce.edu.in" 
                />
                <ProfileField 
                  icon={Bookmark} 
                  label="Role" 
                  value="Third-year B. Tech Student" 
                />
                <ProfileField 
                  icon={Briefcase} 
                  label="Department" 
                  value="Artificial Intelligence and Data Science" 
                />
                <ProfileField 
                  icon={Building} 
                  label="Organization" 
                  value="SVKM's Dwarkadas J. Sanghvi College of Engineering" 
                />
                <ProfileField 
                  icon={MapPin} 
                  label="Location" 
                  value="Mumbai, Maharashtra, India" 
                />
                <ProfileField 
                  icon={Calendar} 
                  label="Joined" 
                  value="December 2022" 
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ProfileFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function ProfileField({ icon: Icon, label, value }: ProfileFieldProps) {
  return (
    <div className="flex items-start py-3 border-b dark:border-gray-800">
      <div className="text-blue-500 dark:text-blue-400 mr-3 mt-0.5">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
} 