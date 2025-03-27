import React from 'react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Enhanced Markdown renderer with better formatting
export const MarkdownRenderer = ({ children, isBot = true }: { children: string; isBot?: boolean }) => (
  <div className={cn("text-sm prose max-w-none overflow-hidden", isBot ? "text-slate-800" : "prose-invert")}>
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
        ul: ({ node, ...props }) => <ul className="mb-3 space-y-2 list-disc pl-5" {...props} />,
        ol: ({ node, ...props }) => <ol className="mb-3 space-y-2 list-decimal pl-5" {...props} />,
        li: ({ node, ...props }) => <li className="ml-2" {...props} />,
        hr: () => <hr className="my-3 border-slate-300" />,
        strong: ({ node, ...props }) => <strong className={cn("font-bold", isBot ? "text-blue-600" : "text-blue-300")} {...props} />,
        h1: ({ node, ...props }) => <h1 className={cn("text-lg font-bold mb-2", isBot ? "text-blue-600" : "text-blue-300")} {...props} />,
        h2: ({ node, ...props }) => <h2 className={cn("text-md font-bold mb-2", isBot ? "text-blue-600" : "text-blue-300")} {...props} />,
        h3: ({ node, ...props }) => <h3 className={cn("text-base font-bold mb-2", isBot ? "text-blue-600" : "text-blue-300")} {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-600 hover:text-pink-600 underline" {...props} />,
        code: ({ node, className, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          return props.inline ? (
            <code className={cn("px-1 py-0.5 rounded text-sm font-mono", isBot ? "bg-slate-100 text-pink-600" : "bg-blue-950/50 text-pink-300")} {...props} />
          ) : (
            <div className={cn("p-3 rounded-md overflow-x-auto my-3", isBot ? "bg-slate-100" : "bg-blue-950/50")}>
              <code className={cn('text-sm font-mono', isBot ? "text-slate-800" : "text-blue-200", match && `language-${match[1]}`)} {...props} />
            </div>
          );
        },
        pre: ({ node, ...props }: any) => <div className="not-prose" {...props} />,
        blockquote: ({ node, ...props }) => 
          <blockquote className={cn("border-l-4 pl-4 italic my-3", isBot ? "border-blue-600/30" : "border-pink-600/30")} {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

interface MessageContentProps {
  msg: Message;
  customClass?: string;
}

// Message content component with user and bot message styling
export const MessageContent: React.FC<MessageContentProps> = ({ msg, customClass }) => (
  <div className={cn(
    "max-w-[85%] rounded-lg p-3 shadow-md",
    msg.type === 'user' 
      ? 'bg-gradient-to-r from-blue-600/90 to-pink-600/90 backdrop-blur-sm text-white' 
      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
    customClass
  )}>
    {msg.type === 'bot' ? (
      <MarkdownRenderer isBot={true}>{msg.content}</MarkdownRenderer>
    ) : (
      <p className="text-sm">{msg.content}</p>
    )}
    <span className={cn(
      "text-xs opacity-70 mt-1 block",
      msg.type === 'user' ? 'text-white/80' : 'text-slate-500'
    )}>
      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
);

export default MessageContent; 