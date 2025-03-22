# Educational AI Agents Crew

Welcome to the Educational AI Agents Crew project, powered by [crewAI](https://crewai.com). This project implements a comprehensive system of AI agents designed to create personalized learning experiences. Our educational agents collaborate to develop tailored learning paths, curate content, assess progress, provide guidance, and create interactive learning experiences.

## Features

This project includes the following specialized educational agents:

### 1. Learning Journey Orchestrator

- Creates personalized learning paths based on student goals, current knowledge, and learning style
- Coordinates with other agents to build a comprehensive educational experience
- Ensures all learning components work together seamlessly

### 2. Content Curator & Synthesizer

- Scans various sources to compile relevant learning materials
- Creates concise, digestible summaries and highlights connections between concepts
- Tailors content to match learning objectives and student preferences

### 3. Adaptive Assessment Engine

- Generates personalized quizzes that adapt in real-time based on performance
- Identifies knowledge gaps and misconceptions
- Measures both factual knowledge and conceptual understanding

### 4. Study Buddy

- Acts as a conversational learning companion
- Explains concepts, provides examples, and answers questions
- Engages in Socratic dialogue to deepen understanding

### 5. Research Assistant

- Guides students through the complete research process
- Helps develop research questions, methodologies, and analysis techniques
- Teaches essential research skills and critical evaluation of sources

### 6. Writing Coach

- Provides iterative feedback on writing assignments
- Suggests improvements for clarity, structure, and argumentation
- Maintains the student's authentic voice and builds confidence

### 7. Project Manager

- Breaks down complex assignments into manageable tasks
- Creates timelines, milestones, and accountability systems
- Develops essential time management and planning skills

### 8. Simulation Creator

- Builds interactive scenarios that allow application of theoretical knowledge
- Creates decision points that require critical thinking
- Provides safe spaces to experiment and learn from mistakes

## Installation

Ensure you have Python >=3.10 <3.13 installed on your system. This project uses [UV](https://docs.astral.sh/uv/) for dependency management and package handling.

First, if you haven't already, install uv:

```bash
pip install uv
```

Next, navigate to your project directory and install the dependencies:

```bash
crewai install
```

### Configuration

**Add your `GEMINI_API_KEY` into the `.env` file**

The project is configured to use Google's Gemini models. Your `.env` file should include:

```
GEMINI_API_KEY=your_api_key_here
MODEL=gemini/gemini-1.5-flash
```

You can customize the following files:

- `src/latest_ai_development/config/agents.yaml` to modify agent roles, goals, and backstories
- `src/latest_ai_development/config/tasks.yaml` to modify task descriptions and outputs
- `src/latest_ai_development/crew.py` to customize agent interactions and task flow
- `src/latest_ai_development/main.py` to change default inputs (subject, topic, learning style)

## Running the Project

To kickstart your educational AI agents crew and begin task execution, run this from the root folder of your project:

```bash
$ crewai run
```

This command initializes the Educational AI Agents Crew, creating a personalized learning experience based on the inputs defined in `main.py`.

The output will be saved as `personalized_learning_experience.md` in the root folder, containing a comprehensive learning plan with all components integrated.

### Rate Limiting Prevention

This project includes built-in rate limiting prevention mechanisms to ensure smooth operation with the Gemini API. The system:

- Automatically adds randomized delays between API calls (2-5 seconds)
- Increases delays between major operations like task execution (5-8 seconds)
- Provides detailed logging about delays to monitor API usage
- Implements progressive cooldown periods after intensive operations

These mechanisms help prevent "Too Many Requests" errors from the Gemini API and ensure reliable execution of the educational AI agents. You can adjust the delay parameters in both `crew.py` and `main.py` files if needed.

## Customizing Inputs

You can customize the following inputs in `main.py`:

- `subject`: The main subject area (e.g., "Data Science", "History", "Physics")
- `topic`: A specific focus within the subject (e.g., "Machine Learning Fundamentals")
- `learning_style`: The student's preferred learning approach (e.g., "Visual and hands-on learning")

## Support

For support, questions, or feedback:

- Visit the crewAI [documentation](https://docs.crewai.com)
- Reach out through the [GitHub repository](https://github.com/joaomdmoura/crewai)
- [Join the Discord](https://discord.com/invite/X4JWnZnxPb)
- [Chat with the docs](https://chatg.pt/DWjSBZn)

Create personalized, engaging learning experiences with the power of AI agents!
