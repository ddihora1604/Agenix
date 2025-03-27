import { create } from 'zustand';

export interface JobAgentState {
  // Input fields
  jobInput: string;
  candidateName: string;
  candidateExperience: string;
  interviewDate: string;
  taskType: 'summary' | 'cold_email' | 'interview_prep' | 'all';
  
  // Output fields
  generatedSummary: string | null;
  generatedColdEmail: string | null;
  generatedInterviewPrep: string | null;
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

export const useJobAgentStore = create<JobAgentState>((set) => ({
  // Input fields
  jobInput: '',
  candidateName: '',
  candidateExperience: '',
  interviewDate: '',
  taskType: 'all',
  
  // Output fields
  generatedSummary: null,
  generatedColdEmail: null,
  generatedInterviewPrep: null,
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