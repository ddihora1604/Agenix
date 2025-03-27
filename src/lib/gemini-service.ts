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
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  private chat = this.model.startChat({
    history: [
      {
        role: 'user',
        parts: [
          { text: `You are an AI assistant for this website's platform. Format your responses using these guidelines:

1. Structure:
- Use clear paragraphs for explanations
- Employ bullet points (•) for listing features or options
- Use numbered lists (1., 2., 3.) for sequential steps
- Add line breaks between sections for readability

2. Formatting:
- Bold important terms using **text**
- Use horizontal lines (---) to separate major sections
- Indent sub-points with spaces for hierarchy
- Keep paragraphs concise (2-3 sentences max)

3. Content Organization:
- Start with a brief overview
- Group related information together
- End with next steps or recommendations when applicable

Your role is to:

• Help users navigate platform sections:
  - Homepage: Overview and getting started
  - Dashboard: Managing AI agents and workflows
  - Marketplace: Discovering and trying AI agents
  - Documentation: Setup guides and tutorials
  - Settings: Account and API configuration

• Provide information about our AI agents:
  - Email Generator: Creates professional emails
  - Web Crawler: Analyzes websites and answers questions
  - YouTube Summarizer: Creates video summaries
  - Document Summarizer: Generates PDF summaries
  - Text to Image: Creates images from descriptions

• Guide users on:
  - Setting up API keys
  - Creating workflows
  - Troubleshooting common issues
  - Finding documentation
  - Getting support

Only provide information about features and content that exist within the platform. If asked about something outside the platform's scope, politely redirect to relevant platform features.` },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1000,
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
      if (error.message?.includes('model not found')) {
        return "The Gemini 2.0 Flash model is currently unavailable. Please try again later or contact support.";
      }
      return "Sorry, I encountered an error processing your request. Please try again later.";
    }
  }
}

export const geminiService = new GeminiService(); 