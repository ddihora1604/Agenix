'use client';

import React, { useState } from 'react';
import { 
  Settings, Moon, Sun, Bell, User, Workflow, Palette, Cpu, Zap,
  Save, Undo, CheckCircle, Sliders, Layout, Shield, BarChart, Clock,
  Mail
} from 'lucide-react';
import { useTheme } from 'next-themes';

const SettingsPage = () => {
  // Theme settings
  const { theme, setTheme } = useTheme();

  // Form state for all settings
  const [formState, setFormState] = useState({
    // Workflow preferences
    defaultWorkflow: 'Marketing',
    autoExecute: false,
    saveHistory: true,
    maxHistoryItems: 10,
    
    // UI customization
    sidebarCollapsed: false,
    cardAnimations: true,
    compactMode: false,
    chartAnimations: true,
    
    // Agent management
    maxAgentsPerWorkflow: 5,
    agentTimeout: 30,
    defaultAgentCategory: 'Marketing',
    parallelExecution: false,
    
    // Execution parameters
    executionTimeout: 60,
    retryOnFailure: true,
    maxRetries: 3,
    notifyOnCompletion: true,
    
    // Notification settings
    emailNotifications: false,
    pushNotifications: true,
    notificationSound: true,
    dailyDigest: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to backend/localStorage
    console.log('Saving settings:', formState);
    
    // Show success message (in a real app, would use a toast notification)
    alert('Settings saved successfully!');
  };

  const handleResetSettings = () => {
    // In a real app, this would reset to default values from backend/localStorage
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset form to initial state
      setFormState({
        // Workflow preferences
        defaultWorkflow: 'Marketing',
        autoExecute: false,
        saveHistory: true,
        maxHistoryItems: 10,
        
        // UI customization
        sidebarCollapsed: false,
        cardAnimations: true,
        compactMode: false,
        chartAnimations: true,
        
        // Agent management
        maxAgentsPerWorkflow: 5,
        agentTimeout: 30,
        defaultAgentCategory: 'Marketing',
        parallelExecution: false,
        
        // Execution parameters
        executionTimeout: 60,
        retryOnFailure: true,
        maxRetries: 3,
        notifyOnCompletion: true,
        
        // Notification settings
        emailNotifications: false,
        pushNotifications: true,
        notificationSound: true,
        dailyDigest: false,
      });
    }
  };

  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">
      <div className="flex items-center mb-1">
        <Settings className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="w-full flex justify-end pr-1">

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5 mr-2" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 mr-2" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-10">
        {/* Theme Toggle - Special placement outside sections */}
        {/* <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-5 w-5 mr-2" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 mr-2" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div> */}

        {/* Workflow Preferences */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Workflow className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workflow Preferences</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Workflow
              </label>
              <select
                name="defaultWorkflow"
                value={formState.defaultWorkflow}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Marketing">Marketing</option>
                <option value="Corporate Productivity">Corporate Productivity</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max History Items
              </label>
              <input
                type="number"
                name="maxHistoryItems"
                min="1"
                max="100"
                value={formState.maxHistoryItems}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoExecute"
                name="autoExecute"
                checked={formState.autoExecute}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="autoExecute" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-execute workflow when configured
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saveHistory"
                name="saveHistory"
                checked={formState.saveHistory}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="saveHistory" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Save workflow execution history
              </label>
            </div>
          </div>
        </section>

        {/* UI Customization */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Palette className="h-6 w-6 mr-2 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">UI Customization</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sidebarCollapsed"
                name="sidebarCollapsed"
                checked={formState.sidebarCollapsed}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="sidebarCollapsed" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Collapsed sidebar by default
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="cardAnimations"
                name="cardAnimations"
                checked={formState.cardAnimations}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="cardAnimations" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable card animations
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="compactMode"
                name="compactMode"
                checked={formState.compactMode}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="compactMode" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Compact mode
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="chartAnimations"
                name="chartAnimations"
                checked={formState.chartAnimations}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="chartAnimations" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable chart animations
              </label>
            </div>
          </div>
        </section>

        {/* Agent Management */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Cpu className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agent Management</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Agents Per Workflow
              </label>
              <input
                type="number"
                name="maxAgentsPerWorkflow"
                min="1"
                max="10"
                value={formState.maxAgentsPerWorkflow}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Timeout (seconds)
              </label>
              <input
                type="number"
                name="agentTimeout"
                min="10"
                max="300"
                value={formState.agentTimeout}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Agent Category
              </label>
              <select
                name="defaultAgentCategory"
                value={formState.defaultAgentCategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Marketing">Marketing</option>
                <option value="Productivity">Productivity</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="parallelExecution"
                name="parallelExecution"
                checked={formState.parallelExecution}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="parallelExecution" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable parallel agent execution
              </label>
            </div>
          </div>
        </section>

        {/* Execution Parameters */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Zap className="h-6 w-6 mr-2 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Execution Parameters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Execution Timeout (seconds)
              </label>
              <input
                type="number"
                name="executionTimeout"
                min="30"
                max="600"
                value={formState.executionTimeout}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                name="maxRetries"
                min="0"
                max="10"
                value={formState.maxRetries}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="retryOnFailure"
                name="retryOnFailure"
                checked={formState.retryOnFailure}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="retryOnFailure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Retry failed executions automatically
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnCompletion"
                name="notifyOnCompletion"
                checked={formState.notifyOnCompletion}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="notifyOnCompletion" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show notification on workflow completion
              </label>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={formState.emailNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Email notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pushNotifications"
                name="pushNotifications"
                checked={formState.pushNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="pushNotifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Push notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificationSound"
                name="notificationSound"
                checked={formState.notificationSound}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="notificationSound" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Notification sound
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dailyDigest"
                name="dailyDigest"
                checked={formState.dailyDigest}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="dailyDigest" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Daily digest email
              </label>
            </div>
          </div>
        </section>

        {/* User Profile Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Account</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value="user@example.com"
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">Contact administrator to change email</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value="marketing_user"
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </button>
            </div>
          </div>
        </section>

        {/* Analytics & Data */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <BarChart className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics & Data</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Usage Statistics</span>
              </div>
              <button
                type="button"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                View Report
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center">
                <Layout className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Workflow Analytics</span>
              </div>
              <button
                type="button"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                View Dashboard
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Export Data</span>
              </div>
              <button
                type="button"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Export
              </button>
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleResetSettings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Undo className="h-4 w-4 mr-2" />
            Reset to Defaults
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage; 