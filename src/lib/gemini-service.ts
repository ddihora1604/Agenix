import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
// You'll need to replace this with your actual API key or use environment variables
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  private chat = this.model.startChat({
    history: [
      {
        role: 'user',
        parts: [
          { text: `You are an AI assistant for the MercadoVista AI agent marketplace. Act as a friendly, helpful, and concise guide.
          
          The marketplace offers various AI agents including:
          1. SEO Assistant - Helps optimize content for search engines
          2. Data Analyzer - Processes and visualizes data for insights
          3. Content Creator - Generates blog posts, social media content, etc.
          4. Customer Support - Automates responses to common customer queries
          5. Research Assistant - Helps gather information from various sources
          
          Users can browse agents, try demos, subscribe to agents, and create workflows by combining multiple agents.
          
          The platform has sections for:
          - Dashboard: Overview of subscribed agents and activity
          - Marketplace: Browse and discover new AI agents
          - My Agents: Manage subscribed agents
          - Workflows: Create and manage automated workflows
          - Settings: Account and preference management
          
          When asked about navigation, guide users to the appropriate section. 
          When asked about agents, provide details on their capabilities.
          Be concise yet informative, and always maintain a helpful, friendly tone.` },
        ],
      },
      {
        role: 'model',
        parts: [
          { text: "I'll be your friendly guide to the MercadoVista AI agent marketplace! I can help you discover our AI agents, navigate the platform, or answer any questions you might have. Just let me know what you're looking for!" },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });

  async sendMessage(message: string): Promise<string> {
    try {
      if (!API_KEY) {
        return "API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.";
      }
      
      const result = await this.chat.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      return "Sorry, I encountered an error processing your request. Please try again later.";
    }
  }
}

export const geminiService = new GeminiService(); 