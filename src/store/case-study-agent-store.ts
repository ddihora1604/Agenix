import { create } from 'zustand';

export interface CaseStudyAgentState {
  // Input fields
  topic: string;
  contextUrl: string;
  
  // Output fields
  generatedOutline: string | null;
  generatedCaseStudy: string | null;
  warnings: string[];
  
  // Process states
  isProcessing: boolean;
  error: string | null;
  apiKeyMissing: boolean;
  pythonError: boolean;
  rateLimitExceeded: boolean;
  successMessage: string | null;
  retryCount: number;
  
  // UI states
  isCopied: boolean;
}

export const useCaseStudyAgentStore = create<CaseStudyAgentState>((set) => ({
  // Input fields
  topic: '',
  contextUrl: '',
  
  // Output fields
  generatedOutline: null,
  generatedCaseStudy: null,
  warnings: [],
  
  // Process states
  isProcessing: false,
  error: null,
  apiKeyMissing: false,
  pythonError: false,
  rateLimitExceeded: false,
  successMessage: null,
  retryCount: 0,
  
  // UI states
  isCopied: false,
})); 