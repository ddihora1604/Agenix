# Agenix - An AI Agent Marketplace

Prototype Demo: https://youtu.be/sq5AJ2MbMgY?si=hHuUwBSU3L0Kaa_1

## 🚀 Project Overview

Agenix is an advanced AI-powered marketplace platform that integrates multiple specialized AI agents to provide comprehensive marketing solutions. The platform combines a modern React frontend with a powerful Python backend, enabling users to create, configure, and execute complex marketing workflows seamlessly.

## 🎯 Key Features

### Workflow Management
- **Drag-and-Drop Interface**: Intuitive workflow builder with visual drag-and-drop functionality
- **Sequential Processing**: Agents execute in user-defined order with real-time progress tracking
- **Dynamic Forms**: Automatically generated input forms based on selected agents
- **Real-time Results**: Instant visualization of agent outputs with markdown support
- **Multi-Agent Support**: Integration with various specialized AI agents

### AI-Powered Agents

1. **Email Generator Agent**
   - Automated email content generation
   - Personalized email campaigns
   - A/B testing support

2. **Blog Writer Agent**
   - AI-powered blog content generation
   - SEO-optimized blog posts
   - Multi-section structured content

3. **Case Study Agent**
   - Automated case study generation
   - Data-driven insights
   - Visual report generation

4. **Document Summarizer Agent**
   - Intelligent document summarization
   - Key point extraction
   - Content analysis

5. **Web Crawler Agent**
   - Automated web data collection
   - Content scraping
   - Data analysis

6. **YouTube Summarizer Agent**
   - YouTube video analysis
   - Content summarization
   - Trend identification

7. **Image Generator Agent**
   - AI-powered image generation
   - Custom visual content creation
   - Multiple style options

8. **Job Agent**
   - Automated job posting analysis
   - Candidate matching
   - Market trend analysis

## 🛠️ Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- Python 3.9+
- npm (Node Package Manager)
- Git

### Installation Steps

#### 1. Clone and Setup Main Project
```bash
git clone https://github.com/ddihora1604/Agenix.git
cd Agenix
npm install
```

#### 2. Create Individual Virtual Environments for Each Agent
Each agent requires its own virtual environment to avoid dependency conflicts:

**Email Generator Agent:**
```bash
cd Email_Generator_Agent
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Blog Writer Agent:**
```bash
cd blog
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Case Study Agent:**
```bash
cd CaseStudyAgent
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Web Crawler Agent:**
```bash
cd webcrawler
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Job Agent:**
```bash
cd JobAgent
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Document Summarizer Agent:**
```bash
cd DocSummarizer
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**YouTube Summarizer Agent:**
```bash
cd YTSummarizer
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Image Generator Agent:**
```bash
cd Fluxai
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

#### 3. Configure API Keys
Create `.env` files in each agent's directory with their required API keys:

**Email_Generator_Agent/.env:**
```env
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

**blog/.env:**
```env
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

**CaseStudyAgent/.env:**
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**webcrawler/.env:**
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**JobAgent/.env:**
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**DocSummarizer/.env:**
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**YTSummarizer/.env:**
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**Fluxai/.env:**
```env
FAL_API_KEY=your_fal_api_key_here
```

#### 4. Start the Development Server
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### How It Works

1. **Main Server**: Next.js runs the frontend and API routes
2. **Agent Execution**: When you click on any agent in the frontend:
   - The corresponding API route (`/api/agent-name`) is called
   - The API route automatically activates the agent's dedicated virtual environment
   - Dependencies are verified (not reinstalled if already present)
   - The Python script executes using the isolated environment
   - Results are returned to the frontend

3. **Dependency Management**: 
   - Each agent has isolated dependencies to prevent version conflicts
   - The system checks if packages are already installed before attempting installation
   - No manual dependency installation needed during runtime

### Agent-Specific Requirements

| Agent | Key Dependencies | LangChain Version |
|-------|------------------|-------------------|
| Email Generator | `langchain==0.1.14`, `langchain-google-genai==0.0.11` | 0.1.14 (Legacy) |
| Blog Writer | `langchain>=0.3.0`, `langchain-groq` | 0.3.x (Modern) |
| Case Study | `langchain>=0.3.0`, `langchain-google-genai` | 0.3.x (Modern) |
| Web Crawler | `langchain>=0.3.0`, `beautifulsoup4`, `faiss-cpu` | 0.3.x (Modern) |
| Job Agent | `langchain>=0.3.0`, `PyPDF2` | 0.3.x (Modern) |
| Document Summarizer | `langchain>=0.3.0`, `PyPDF2`, `python-dotenv` | 0.3.x (Modern) |
| YouTube Summarizer | `langchain>=0.3.0`, `youtube-transcript-api` | 0.3.x (Modern) |
| Image Generator | `fal-client`, `requests`, `python-dotenv` | N/A (Uses FAL API) |

## 📁 Project Structure

```
Agenix/
├── .env                     # Environment configuration
├── .eslintrc.json          # ESLint configuration
├── .git/                    # Git repository files
├── .gitignore              # Git ignore rules (includes all .env files)
├── .next/                   # Next.js build output
├── CaseStudyAgent/         # Case study generation agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   └── CaseStudyAgent/    # Agent source code
│       └── casestudy.py   # Main case study script
├── DocSummarizer/          # Document summarization agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   └── DocSummarizer/     # Agent source code
├── Email_Generator_Agent/  # Email generation agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   └── email_generator.py # Main email generation script
├── Fluxai/                 # AI image generation agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   └── Fluxai/            # Agent source code
├── JobAgent/               # Job analysis agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   ├── JobAgent.py        # Main job agent script
│   └── JobAgent_lite.py   # Lightweight version
├── YTSummarizer/          # YouTube video analysis agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   └── YTSummarizer/      # Agent source code
├── blog/                   # Blog generation agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   ├── blog.py            # Main blog generation script
│   ├── check_api_key.py   # API key validation script
│   └── generated_blogs/   # Generated blog outputs
├── webcrawler/            # Web scraping agent
│   ├── venv/              # Isolated Python virtual environment
│   ├── .env               # Agent-specific API keys (gitignored)
│   ├── requirements.txt   # Agent-specific Python dependencies
│   └── webcrawler/        # Agent source code
│       └── website_agent.py # Main web crawler script
├── public/                # Static assets
│   ├── images/           # Project images
│   ├── fonts/            # Web fonts
│   └── icons/            # UI icons
├── scripts/               # Utility scripts
│   └── create-sample-markdown.js  # Sample markdown generator
├── src/                   # Frontend source code (Next.js)
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes for each agent
│   │   │   ├── blog-generator/route.ts      # Blog agent API
│   │   │   ├── case-study-agent/route.ts    # Case study API
│   │   │   ├── email-generator/route.ts     # Email agent API
│   │   │   ├── job-agent/route.ts           # Job agent API
│   │   │   ├── web-crawler/route.ts         # Web crawler API
│   │   │   └── check-api-key/route.ts       # API key validation
│   │   ├── agents/       # Agent-specific frontend pages
│   │   ├── dashboard/    # Main dashboard
│   │   └── workflows/    # Workflow management
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── store/           # State management (Zustand)
│   └── styles/          # CSS/SCSS files
├── eslint.config.js     # ESLint configuration
├── next-env.d.ts       # Next.js TypeScript configuration
├── next.config.js      # Next.js configuration
├── package-lock.json   # Node package dependencies
├── package.json        # Frontend dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── README.md          # Project documentation
```

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Directory
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom components with Tailwind + Lucide Icons
- **Form Handling**: React Hook Form
- **Animations**: Framer Motion
- **Linting**: ESLint
- **Type Checking**: TypeScript

### Backend Architecture
- **API Layer**: Next.js API Routes (TypeScript)
- **Agent Execution**: Individual Python virtual environments
- **Process Management**: Node.js spawn for Python execution
- **Environment Isolation**: Separate venv for each agent to handle dependency conflicts

### AI Agents & Dependencies
- **Language Models**: 
  - Google Gemini (via LangChain Google GenAI)
  - Groq (via LangChain Groq)
- **LangChain Versions**:
  - Email Generator: LangChain 0.1.14 (legacy compatibility)
  - All other agents: LangChain 0.3.x (modern)
- **Document Processing**: PyPDF2, BeautifulSoup4
- **Vector Storage**: FAISS (for web crawler)
- **Data Processing**: Pandas, Rich (for CLI output)

### Development Tools
- **Package Management**: npm (frontend), pip (individual agent environments)
- **Environment Variables**: dotenv with isolated .env files per agent
- **Error Handling**: Comprehensive error logging and user feedback
- **Security**: API keys isolated per agent, all .env files gitignored

## 🧪Using Individual Agents

1. **Email Generator**
   - Navigate to `/agents/email-generator`
   - Enter email topic and context
   - Click "Generate Email" - the system automatically:
     - Activates the Email Generator's Python venv
     - Checks for existing dependencies (LangChain 0.1.14)
     - Executes the email generation script
     - Returns formatted email content

2. **Blog Writer**
   - Navigate to `/agents/blog-writer`
   - Enter blog topic
   - Click "Generate Blog" - the system automatically:
     - Activates the Blog Writer's Python venv
     - Uses modern LangChain 0.3.x with Groq API
     - Generates structured blog post with multiple sections

3. **Case Study Agent**
   - Navigate to `/agents/case-study-agent`
   - Enter case study topic and optional context URL
   - Click "Generate Case Study" - creates comprehensive case studies

4. **Web Crawler**
   - Navigate to `/agents/web-crawler`
   - Enter website URL and analysis question
   - The crawler analyzes content and provides insights

5. **Job Agent**
   - Navigate to `/agents/job-agent`
   - Upload job descriptions or enter job criteria
   - Get automated job analysis and recommendations

6. **Document Summarizer Agent**
   - Navigate to `/agents/doc-summarizer`
   - Upload PDF documents or text files
   - Click "Summarize" - the system automatically:
     - Activates the Document Summarizer's Python venv
     - Extracts and processes document content
     - Generates key points and comprehensive summaries

7. **YouTube Summarizer Agent**
   - Navigate to `/agents/youtube-summarizer`
   - Enter YouTube video URL
   - Click "Summarize Video" - the system automatically:
     - Activates the YouTube Summarizer's Python venv
     - Extracts video transcript
     - Generates video summary and key insights

8. **Image Generator Agent**
   - Navigate to `/agents/image-generator`
   - Enter image description prompt
   - Select style preferences
   - Click "Generate Image" - the system automatically:
     - Activates the Image Generator's Python venv
     - Uses FAL API for image generation
     - Returns high-quality generated images