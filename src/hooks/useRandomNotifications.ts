import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notifications';

// Categorized notification messages with more relevant content
const notificationMessages = {
  success: [
    // System Updates - Success
    'Agent "DataStreamAI" successfully deployed and running',
    'Configuration changes saved and applied to all active agents',
    'Workflow pipeline completed with 100% success rate',
    'Data synchronization completed successfully',
    'Model training completed with improved accuracy metrics',
    
    // Agent Insights - Success
    'Agent optimization successful: 40% faster processing time achieved',
    'Your custom agent has processed 1000+ transactions successfully',
    'Marketplace purchase completed - new agent ready for deployment',
    'Agent integration with external APIs completed successfully',
    'Collaboration workspace created successfully for your team'
  ],
  info: [
    // User Guidance
    'Did you know? You can create custom workflows by dragging agents together',
    'Pro tip: Configure parallel processing for better performance',
    'Best practice: Schedule regular backups of your agent configurations',
    'New marketplace items are available in the AI Processing category',
    'Try our new keyboard shortcuts for faster navigation',
    
    // Agent Insights
    'Agent "TextAnalyzer" would process this data more efficiently',
    'Consider upgrading your sentiment analysis agent for better results',
    'Your most used agent is "DataStreamProcessor" - explore its advanced features',
    'Agent usage trend: Processing agents are in high demand this week',
    'Your workflow would benefit from our new "ValidationEngine" agent'
  ],
  warning: [
    // System Updates - Warning
    'Agent computing resources are running at 85% capacity',
    'Your subscription will expire in 7 days - renew to avoid interruptions',
    'This operation may take several minutes to complete',
    'Multiple agents attempting to access the same resources',
    'Agent "MarketPredictor" is using legacy APIs that will be deprecated',
    
    // General Alerts
    'Consider optimizing your workflow to improve performance',
    'Limited availability for premium marketplace agents this week',
    'Your current workflow design may cause bottlenecks in processing',
    'Some agent configurations have not been updated in 30 days',
    'Data processing queue building up - consider adding more agents'
  ],
  error: [
    // System Updates - Error
    'Failed to connect to agent deployment server',
    'Agent execution terminated unexpectedly - logs available',
    'Unable to save configuration changes - permission denied',
    'Network connection to processing nodes unstable',
    'Security verification failed for agent deployment',
    
    // General Alerts - Error
    'Data integrity check failed - please verify source data',
    'API rate limit exceeded for external service connections',
    'Insufficient resources to complete the requested operation',
    'Version conflict detected in your agent configurations',
    'Missing required parameters for the custom workflow execution'
  ],
};

export function useRandomNotifications() {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Function to generate a random notification
    const generateRandomNotification = () => {
      // Select a random notification type
      const types = ['success', 'info', 'warning', 'error'] as const;
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      // Select a random message for the chosen type
      const messages = notificationMessages[randomType];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      // Add the notification
      addNotification({
        message: randomMessage,
        type: randomType,
      });
    };

    // Generate initial notification
    generateRandomNotification();
    
    // Set up timer to generate notifications every 2-3 minutes
    const intervalTime = () => (2 * 60 * 1000) + (Math.random() * 60 * 1000);
    let timer = setTimeout(function repeatNotification() {
      generateRandomNotification();
      timer = setTimeout(repeatNotification, intervalTime());
    }, intervalTime());
    
    // Clean up timer on unmount
    return () => clearTimeout(timer);
  }, [addNotification]);
} 