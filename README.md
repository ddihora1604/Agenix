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

2. **Case Study Agent**
   - Automated case study generation
   - Data-driven insights
   - Visual report generation

3. **Doc Summarizer**
   - Intelligent document summarization
   - Key point extraction
   - Content analysis

4. **Job Agent**
   - Automated job posting analysis
   - Candidate matching
   - Market trend analysis

5. **Web Crawler**
   - Automated web data collection
   - Content scraping
   - Data analysis

6. **YT Summarizer**
   - YouTube video analysis
   - Content summarization
   - Trend identification

## 🛠️ Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- Python 3.9+
- npm (Node Package Manager)
- Git

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ddihora1604/MercadoVista.git
   cd MercadoVista
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd marketing_ai
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   python app.py
   ```

## 📁 Project Structure

```
Agenix/
├── .env                     # Environment configuration
├── .eslintrc.json          # ESLint configuration
├── .git/                    # Git repository files
├── .gitignore              # Git ignore rules
├── .next/                   # Next.js build output
├── CaseStudyAgent/         # Case study generation agent
│   └── src/                # Agent source code
├── DocSummarizer/          # Document summarization agent
│   ├── src/               # Agent source code
│   └── tests/             # Unit tests
├── Email_Generator_Agent/  # Email generation agent
│   ├── src/               # Agent source code
│   ├── templates/         # Email templates
│   └── tests/             # Unit tests
├── Fluxai/                 # AI orchestration module
│   ├── src/               # Core AI orchestration code
│   ├── models/            # AI model configurations
│   └── utils/             # Utility functions
├── JobAgent/               # Job analysis agent
│   ├── src/               # Agent source code
│   ├── data/              # Sample job data
│   └── tests/             # Unit tests
├── YTSummarizer/          # YouTube video analysis agent
│   ├── src/               # Agent source code
│   ├── data/              # Sample video data
│   └── tests/             # Unit tests
├── blog/                   # Blog content management
│   ├── content/          # Blog posts
│   ├── templates/        # Blog templates
│   └── static/           # Blog static assets
├── marketing_ai/          # Main backend directory
│   ├── app.py           # Main backend application
│   ├── config/          # Backend configuration
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
├── public/                # Static assets
│   ├── images/          # Project images
│   ├── fonts/           # Web fonts
│   └── icons/           # UI icons
├── scripts/               # Utility scripts
│   └── create-sample-markdown.js  # Sample markdown generator
├── src/                   # Frontend source code
│   ├── components/      # React components
│   ├── pages/          # Next.js pages
│   ├── styles/         # CSS/SCSS files
│   ├── utils/          # Utility functions
│   └── hooks/          # Custom React hooks
├── webcrawler/           # Web scraping module
│   ├── src/            # Crawler source code
│   ├── config/         # Crawler configuration
│   └── tests/          # Unit tests
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
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **UI Components**: Custom components with Tailwind
- **Data Visualization**: Chart.js
- **Linting**: ESLint
- **Type Checking**: TypeScript

### Backend
- **Framework**: FastAPI
- **AI Integration**: CrewAI
- **Language Models**: OpenAI GPT-4
- **Data Processing**: Pandas
- **Web Scraping**: BeautifulSoup
- **Task Scheduling**: Celery

## 📝 Usage Guide

1. **Getting Started**
   - Navigate to the Dashboard
   - Select your desired workflow type
   - Configure agents using drag-and-drop interface
   - Set up required parameters

2. **Creating Workflows**
   - Drag agents from the sidebar
   - Arrange them in desired order
   - Connect agents using workflow builder
   - Save your workflow configuration

3. **Executing Workflows**
   - Select your saved workflow
   - Fill in required input parameters
   - Click "Execute" to run analysis
   - View real-time results in the dashboard

4. **Managing Results**
   - View markdown reports
   - Export results
   - Generate visualizations
   - Save workflow configurations