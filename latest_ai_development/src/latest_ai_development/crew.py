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

class LatestAiDevelopment():
    """Educational AI Agents Crew for Personalized Learning"""

    def __init__(self):
        print("Initializing educational AI agents with rate limiting prevention...")
        # Create all agents
        self.agents = self._create_agents()
        # Create all tasks
        self.tasks = self._create_tasks()

    def _create_agents(self):
        """Create all the educational agents"""
        
        print("Creating Learning Journey Orchestrator agent...")
        learning_journey_orchestrator = Agent(
            role="Learning Journey Orchestrator",
            goal="Create personalized learning paths that adapt to individual needs while coordinating with other educational agents",
            backstory="You're a master educational strategist with deep expertise in learning sciences and curriculum design. You excel at understanding students' unique learning styles, identifying knowledge gaps, and creating comprehensive learning pathways that integrate multiple disciplines. Your ultimate goal is to ensure each student achieves mastery through a tailored educational journey that evolves as they progress.",
            verbose=True,
            allow_delegation=True,
            llm=MODEL_NAME
        )

        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Content Curator agent...")
        content_curator = Agent(
            role="Content Curator & Synthesizer",
            goal="Collect, synthesize, and organize the most relevant learning resources across diverse sources",
            backstory="You're a knowledge expert with exceptional skills in information retrieval and content synthesis. You have a talent for scanning vast amounts of information to find the most relevant, accurate, and engaging materials. You excel at distilling complex concepts into clear, digestible formats and building connections between seemingly disparate topics to help students see the bigger picture.",
            verbose=True,
            llm=MODEL_NAME
        )

        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Assessment Engine agent...")
        assessment_engine = Agent(
            role="Adaptive Assessment Engine",
            goal="Design personalized assessments that accurately measure understanding while adapting difficulty in real-time",
            backstory="You're an assessment expert with deep knowledge of educational measurement and cognitive psychology. Your specialty is creating evaluations that go beyond simple recall to test true understanding, critical thinking, and application of knowledge. You're skilled at analyzing performance patterns to identify specific knowledge gaps and automatically adjusting future questions to target areas needing improvement.",
            verbose=True,
            llm=MODEL_NAME
        )

        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Study Buddy agent...")
        study_buddy = Agent(
            role="Study Buddy",
            goal="Support learning through conversational explanation, questioning, and real-time guidance",
            backstory="You're a patient, encouraging learning companion with expertise across multiple subject areas. You have excellent skills in explaining complex topics in approachable ways, providing relevant examples, and using Socratic questioning to guide students toward deeper understanding. You're responsive to emotional cues and can adapt your approach based on a student's frustration or confidence levels.",
            verbose=True,
            llm=MODEL_NAME
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Research Assistant agent...")
        research_assistant = Agent(
            role="Research Assistant",
            goal="Guide students through the complete research process while building critical research skills",
            backstory="You're a seasoned researcher with expertise in research methodologies across various disciplines. You excel at helping students transform vague interests into focused research questions, select appropriate methods, find reliable sources, analyze data critically, and present findings effectively. You emphasize ethical research practices and cultivate information literacy skills essential for academic and professional success.",
            verbose=True,
            llm=MODEL_NAME
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Writing Coach agent...")
        writing_coach = Agent(
            role="Writing Coach",
            goal="Help students develop strong writing skills through personalized feedback and guidance",
            backstory="You're a masterful writing instructor with experience across genres and disciplines. You have a keen eye for structural issues, logical flow, and stylistic elements that can improve writing. Your feedback balances encouragement with constructive criticism, and you excel at helping students develop their unique voice while meeting academic standards. You guide the entire writing process from brainstorming to final polishing.",
            verbose=True,
            llm=MODEL_NAME
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Project Manager agent...")
        project_manager = Agent(
            role="Project Manager",
            goal="Help students plan, organize, and successfully complete complex academic projects",
            backstory="You're an organizational expert with deep experience in project management methodologies. You excel at breaking down complex tasks into manageable steps, creating realistic timelines, anticipating potential obstacles, and developing accountability systems. You help students develop essential time management and planning skills while ensuring they stay motivated throughout lengthy projects.",
            verbose=True,
            llm=MODEL_NAME
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("agent creation")

        print("Creating Simulation Creator agent...")
        simulation_creator = Agent(
            role="Simulation Creator",
            goal="Design interactive learning experiences that allow practical application of theoretical knowledge",
            backstory="You're an educational technologist with expertise in creating immersive simulations across disciplines. You excel at translating abstract concepts into engaging scenarios that mirror real-world complexity. Your simulations incorporate decision points that require critical thinking and application of knowledge, providing students with safe spaces to experiment, fail, learn from mistakes, and develop practical skills before facing real-world situations.",
            verbose=True,
            llm=MODEL_NAME
        )

        # Add a longer delay before returning agents
        add_delay("completing agent creation")

        print("All agents created successfully!")

        # Return a dictionary of agents for easy reference
        return {
            "learning_journey_orchestrator": learning_journey_orchestrator,
            "content_curator": content_curator,
            "assessment_engine": assessment_engine,
            "study_buddy": study_buddy,
            "research_assistant": research_assistant,
            "writing_coach": writing_coach,
            "project_manager": project_manager,
            "simulation_creator": simulation_creator
        }

    def _create_tasks(self):
        """Create all the educational tasks"""
        
        print("Creating Learning Path Task...")
        # Create Learning Path Task
        create_learning_path = Task(
            description="Create a personalized learning path for the student based on their goals, current knowledge level, and learning style. The learning path should include: 1. A clear progression of learning objectives 2. Recommended resources and activities 3. Assessment points to measure progress 4. Estimated time requirements for each component 5. A strategy for adjusting the path based on performance Use {subject} as the main learning area and consider {learning_style} as the student's preferred learning approach.",
            expected_output="A comprehensive learning plan with clear objectives, resources, activities, and assessment points that align with the student's goals and learning style. The plan should include a visual representation of the learning path and detailed descriptions of each component.",
            agent=self.agents["learning_journey_orchestrator"]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Content Curation Task...")
        # Curate Learning Materials Task
        curate_learning_materials = Task(
            description="Research and compile the most relevant, high-quality learning materials for {subject} with a focus on {topic}. The materials should include a mix of: 1. Academic sources (textbooks, journal articles) 2. Interactive resources (videos, tutorials) 3. Practical examples and case studies 4. Supplementary materials for different learning styles Create concise summaries of each resource and explain how they connect to the broader learning objectives.",
            expected_output="A curated collection of learning materials with summaries, relevance ratings, and recommendations for when/how to use each resource in the learning process. Include a concept map that shows connections between different resources and topics.",
            agent=self.agents["content_curator"],
            dependencies=[create_learning_path]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Assessment Plan Task...")
        # Create Assessment Plan Task
        create_assessment_plan = Task(
            description="Design an adaptive assessment strategy for {subject} that will: 1. Establish baseline knowledge through initial diagnostics 2. Provide regular knowledge checks with increasing complexity 3. Adapt question difficulty based on student performance 4. Identify specific knowledge gaps and misconceptions 5. Measure both factual knowledge and conceptual understanding The assessments should align with the learning objectives identified in the learning path.",
            expected_output="A comprehensive assessment plan with sample questions at various difficulty levels, a system for analyzing responses, criteria for adapting difficulty, and metrics for measuring progress. Include instructions for generating new questions based on performance patterns.",
            agent=self.agents["assessment_engine"],
            dependencies=[create_learning_path]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Study Guide Task...")
        # Develop Study Guide Task
        develop_study_guide = Task(
            description="Create a conversational study guide for {subject} focusing on {topic} that: 1. Explains core concepts in clear, accessible language 2. Anticipates common questions and misconceptions 3. Provides concrete examples and analogies 4. Includes Socratic questions to deepen understanding 5. Offers alternative explanations for difficult concepts The guide should match the student's {learning_style} and current knowledge level.",
            expected_output="A comprehensive study companion that can be used for reference and self-study. The guide should include explanations, examples, questions, and alternative approaches to help students understand difficult concepts. Format it as a conversational Q&A resource with rich examples.",
            agent=self.agents["study_buddy"],
            dependencies=[curate_learning_materials]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Research Project Task...")
        # Design Research Project Task
        design_research_project = Task(
            description="Develop a structured research project for {subject} that will help the student practice essential research skills. The project should include: 1. Guidelines for formulating a research question related to {topic} 2. Research methodology appropriate for the subject area 3. Strategies for finding and evaluating sources 4. Methods for data collection and analysis 5. Framework for presenting and discussing findings The project should be challenging but achievable given the student's current level.",
            expected_output="A comprehensive research project guide that walks students through each step of the research process with templates, examples, and evaluation criteria. Include tips for avoiding common pitfalls and strategies for developing critical research skills.",
            agent=self.agents["research_assistant"],
            dependencies=[create_learning_path, curate_learning_materials]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Writing Assignment Task...")
        # Create Writing Assignment Task
        create_writing_assignment = Task(
            description="Design a writing assignment for {subject} with {topic} focus that will help students develop their writing skills. The assignment should include: 1. Clear prompt and objectives aligned with learning goals 2. Structured pre-writing activities (outlining, research) 3. Guidelines for drafting, revision, and editing 4. Rubric with specific criteria for evaluation 5. Examples of strong writing in the relevant genre The assignment should challenge students while providing clear guidance.",
            expected_output="A complete writing assignment package with prompt, instructions, rubric, supporting materials, and a feedback framework. Include strategies for providing constructive criticism while maintaining the student's authentic voice and confidence.",
            agent=self.agents["writing_coach"],
            dependencies=[create_learning_path]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Project Plan Task...")
        # Develop Project Plan Task
        develop_project_plan = Task(
            description="Create a project management plan for a complex {subject} assignment related to {topic}. The plan should include: 1. A project breakdown with clear milestones and deliverables 2. A realistic timeline with buffer periods for unexpected issues 3. Guidelines for time management and prioritization 4. Strategies for monitoring progress and staying motivated 5. Templates for planning, tracking, and reflection The plan should help students develop project management skills while completing their assignment.",
            expected_output="A detailed project management toolkit with templates, timeline, milestone tracking system, and accountability measures. Include contingency planning and strategies for overcoming common obstacles to project completion.",
            agent=self.agents["project_manager"],
            dependencies=[create_learning_path]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Simulation Task...")
        # Design Simulation Task
        design_simulation = Task(
            description="Create an interactive simulation or scenario for {subject} that allows students to apply theoretical knowledge about {topic} in a practical context. The simulation should: 1. Mirror real-world complexity and constraints 2. Include decision points that require critical thinking 3. Provide immediate feedback on choices and actions 4. Scale in difficulty as students demonstrate mastery 5. Connect explicitly to the learning objectives The simulation should be engaging while reinforcing key concepts from the curriculum.",
            expected_output="A detailed simulation design with scenario descriptions, decision trees, feedback mechanisms, and assessment criteria. Include guidelines for implementing the simulation and connecting it to other learning activities.",
            agent=self.agents["simulation_creator"],
            dependencies=[create_learning_path, curate_learning_materials]
        )
            
        # Add a delay to prevent potential rate limits
        add_delay("task creation")

        print("Creating Integration Task...")
        # Integrate Learning Components Task
        integrate_learning_components = Task(
            description="Review all the components created by the educational agents and create a cohesive, integrated learning experience for {subject} focused on {topic}. The integration should: 1. Ensure logical progression and connections between all components 2. Identify and resolve any contradictions or gaps 3. Create a unified narrative that carries through all materials 4. Develop transitions between different learning activities 5. Provide a master schedule that incorporates all elements The final product should feel like a seamless educational experience rather than separate components.",
            expected_output="A comprehensive learning experience blueprint that shows how all components work together to support learning objectives. Include a master schedule, integration points, and an overall narrative that connects all learning activities. The final product should be cohesive, engaging, and pedagogically sound.",
            agent=self.agents["learning_journey_orchestrator"],
            dependencies=[
                curate_learning_materials,
                create_assessment_plan,
                develop_study_guide,
                design_research_project,
                create_writing_assignment,
                develop_project_plan,
                design_simulation
            ],
            output_file='personalized_learning_experience.md'
        )

        # Add a longer delay before returning tasks
        add_delay("completing task creation")
        
        print("All tasks created successfully!")

        # Return tasks as a list in the order they should be executed
        return [
            create_learning_path,
            curate_learning_materials,
            create_assessment_plan,
            develop_study_guide,
            design_research_project,
            create_writing_assignment,
            develop_project_plan,
            design_simulation,
            integrate_learning_components
        ]

    def crew(self):
        """Creates the Educational AI Agents crew"""
        print("Creating Educational AI Agents crew with rate limiting prevention...")
        
        # Create the crew with all agents and tasks
        crew = Crew(
            agents=list(self.agents.values()),
            tasks=self.tasks,
            process=Process.sequential,  # Using sequential process instead of hierarchical to avoid delegation issues
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
        
        print("Crew created successfully with enhanced rate limiting prevention!")
        return crew
