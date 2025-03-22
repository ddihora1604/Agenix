# Marketing AI Agents Workflow

This project integrates a set of AI-powered marketing agents with a React frontend, allowing users to configure and execute marketing workflows.

## Features

- **Dynamic Workflow Configuration**: Drag and drop or select marketing agents to create customized workflows
- **Sequential Execution**: Agents run in the exact order they are placed in the workflow
- **User Input Collection**: Dynamically generated input forms based on the configured agents
- **Real-time Results Display**: View the formatted output from each marketing agent
- **Beautiful UI**: Intuitive, visually appealing interface with smooth interactions

## Available Marketing Agents

1. **Competitor Watchdog**: Monitors and analyzes competitor activities in real-time
2. **Product Recommender**: Provides AI-driven product recommendations based on customer behavior
3. **Trend Analyst**: Identifies and analyzes market trends and patterns
4. **Content Creator**: Generates engaging marketing content automatically
5. **Sales Strategist**: Develops data-driven sales strategies

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. Navigate to the Dashboard
2. Select "Marketing" from the workflow selector
3. Configure your workflow by either:
   - Clicking the "Configure" button on agent cards
   - Dragging agents into the workflow area
4. Arrange agents in the desired execution order
5. Click "Launch Workflow" to start
6. Fill in the required input fields
7. Click "Submit" to execute the workflow
8. View the results from each agent in the results section

## Backend Integration

The marketing agents are powered by a Python backend located in the `marketing_ai` directory. The backend uses:

- **CrewAI**: For agent orchestration and workflow management
- **LLM Integration**: Connects to language models for AI-powered processing
- **Sequential Processing**: Executes agents in the specific order defined by the user

## Technical Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Python, CrewAI
- **Data Visualization**: Chart.js
- **UI Components**: Custom components with Tailwind

## Notes

- This is a demo environment with simulated backend responses
- In a production environment, you would connect to the actual Python backend
- The input forms dynamically adjust based on the agents selected for the workflow 