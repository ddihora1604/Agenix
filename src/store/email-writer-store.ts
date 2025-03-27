import { create } from 'zustand';

// Define the store state interface
interface EmailWriterState {
  emailPrompt: string;
  generatedEmail: string;
  isGenerating: boolean;
  error: string | null;
  apiKeyMissing: boolean;
  successMessage: string | null;
  pythonError: boolean;
  retryCount: number;
  isCopied: boolean;
}

// Create the store
export const useEmailWriterStore = create<EmailWriterState>(() => ({
  emailPrompt: '',
  generatedEmail: '',
  isGenerating: false,
  error: null,
  apiKeyMissing: false,
  successMessage: null,
  pythonError: false,
  retryCount: 0,
  isCopied: false,
})); 