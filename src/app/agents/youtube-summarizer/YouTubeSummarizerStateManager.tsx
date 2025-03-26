import React, { createContext, useContext, useState, ReactNode } from 'react';

interface YouTubeSummarizerState {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  summary: string;
  setSummary: (summary: string) => void;
  thumbnailUrl: string;
  setThumbnailUrl: (url: string) => void;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
}

const YouTubeSummarizerContext = createContext<YouTubeSummarizerState | undefined>(undefined);

export const YouTubeSummarizerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  return (
    <YouTubeSummarizerContext.Provider 
      value={{
        videoUrl,
        setVideoUrl,
        summary,
        setSummary,
        thumbnailUrl,
        setThumbnailUrl,
        videoTitle,
        setVideoTitle
      }}
    >
      {children}
    </YouTubeSummarizerContext.Provider>
  );
};

export const useYoutubeSummarizerState = () => {
  const context = useContext(YouTubeSummarizerContext);
  if (context === undefined) {
    throw new Error('useYoutubeSummarizerState must be used within a YouTubeSummarizerProvider');
  }
  return context;
}; 