from crewai import Agent, Crew, Process, Task
import os
import time
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Gemini API settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("MODEL", "gemini/gemini-1.5-flash")

# Rate limiting prevention configuration
MIN_DELAY = 2  # Minimum delay between API calls in seconds
MAX_DELAY = 5  # Maximum delay for randomized waits
TASK_EXECUTION_DELAY = 5  # Delay between task executions

def add_delay(reason="API call"):
    """Add a randomized delay to prevent rate limiting"""
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    print(f"Adding {delay:.2f}s delay for {reason}...")
    time.sleep(delay)
    return delay

class SimpleEducationCrew():
    """Simple Educational AI Agents Crew for Testing"""

    def __init__(self):
        print("Initializing simplified educational AI agents...")
        # Create all agents
        self.agents = self._create_agents()
        # Create all tasks
        self.tasks = self._create_tasks()

    def _create_agents(self):
        """Create a simplified set of educational agents"""
        
        print("Creating Learning Planner agent...")
        learning_planner = Agent(
            role="Learning Planner",
            goal="Create personalized learning paths that adapt to individual needs",
            backstory="You're an educational strategist who specializes in creating tailored learning plans. You understand how to structure learning objectives and activities to maximize knowledge retention and skill development.",
            verbose=True,
            # Explicitly disable delegation to avoid errors
            allow_delegation=False,
            llm=MODEL_NAME
        )

        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Content Curator agent...")
        content_curator = Agent(
            role="Content Curator",
            goal="Find and organize the best learning resources for specific topics",
            backstory="You're an expert at finding high-quality educational materials across different formats. You know how to evaluate resources for accuracy, clarity, and engagement level.",
            verbose=True,
            allow_delegation=False,
            llm=MODEL_NAME
        )

        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Study Guide Creator agent...")
        study_guide_creator = Agent(
            role="Study Guide Creator",
            goal="Create clear, concise study materials that explain complex concepts",
            backstory="You're skilled at breaking down difficult topics into understandable pieces. You create study materials that include explanations, examples, and practice questions to help learners master new concepts.",
            verbose=True,
            allow_delegation=False,
            llm=MODEL_NAME
        )

        # Add a longer delay before returning agents
        add_delay("completing agent creation")

        print("All agents created successfully!")

        # Return a dictionary of agents for easy reference
        return {
            "learning_planner": learning_planner,
            "content_curator": content_curator,
            "study_guide_creator": study_guide_creator
        }

    def _create_tasks(self):
        """Create simplified educational tasks"""
        
        print("Creating Learning Plan Task...")
        # Create Learning Plan Task
        create_learning_plan = Task(
            description="Create a simple learning plan for {subject} focusing on {topic}. The plan should include: 1. Three clear learning objectives, 2. A suggested learning sequence, 3. Time estimates for each component. Consider that this is for a student with {learning_style} preferences.",
            expected_output="A concise learning plan with objectives, sequence, and time estimates.",
            agent=self.agents["learning_planner"]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Content Curation Task...")
        # Curate Learning Materials Task
        curate_materials = Task(
            description="Find and recommend 5 high-quality learning resources for {subject} with a focus on {topic}. Include at least one video, one text-based resource, and one interactive resource. For each resource, provide a brief description and explain why it's valuable.",
            expected_output="A list of 5 curated resources with descriptions and explanations of their value.",
            agent=self.agents["content_curator"],
            dependencies=[create_learning_plan]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Study Guide Task...")
        # Create Study Guide Task
        create_study_guide = Task(
            description="Create a concise study guide for {subject} focusing on {topic}. The guide should include: 1. Key concepts explained in simple terms, 2. Three illustrative examples, 3. Five practice questions with answers. The guide should match the student's {learning_style} preferences.",
            expected_output="A study guide with key concept explanations, examples, and practice questions.",
            agent=self.agents["study_guide_creator"],
            dependencies=[curate_materials],
            output_file='simple_study_guide.md'
        )
            
        # Add a longer delay before returning tasks
        add_delay("completing task creation")
        
        print("All tasks created successfully!")

        # Return tasks as a list in the order they should be executed
        return [
            create_learning_plan,
            curate_materials,
            create_study_guide
        ]

    def crew(self):
        """Creates a simplified Educational AI Agents crew"""
        print("Creating simplified Educational AI Agents crew with rate limiting prevention...")
        
        # Create the crew with all agents and tasks
        crew = Crew(
            agents=list(self.agents.values()),
            tasks=self.tasks,
            process=Process.sequential,  # Using sequential process
            verbose=True,
            llm=MODEL_NAME
        )
        
        # Add a function that will execute the tasks with delays in between
        original_execute_tasks = crew._execute_tasks
        
        def execute_tasks_with_delay(tasks):
            # Override the execute_tasks function to add delays between task executions
            results = []
            for task in tasks:
                # Add a delay before executing each task
                delay_time = TASK_EXECUTION_DELAY + random.uniform(1, 3)  # Add randomness to delay
                print(f"Waiting {delay_time:.2f}s before starting next task to prevent rate limiting...")
                time.sleep(delay_time)
                
                print(f"Starting task with agent: {task.agent.role}")
                result = original_execute_tasks([task])
                
                # Add delay after task execution
                add_delay(f"cooling down after {task.agent.role}'s task")
                
                results.extend(result)
            return results
            
        # Replace the execute_tasks method with our custom one
        crew._execute_tasks = execute_tasks_with_delay
        
        print("Simplified crew created successfully with rate limiting prevention!")
        return crew 