from crewai import Agent, Crew, Process, Task
import os
import time
import random
import logging
import json
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional, Set, Tuple
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('DynamicEducationCrew')

# Load environment variables
load_dotenv()

# Gemini API settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_KEY_2 = os.getenv("GEMINI_API_KEY_2")  # Get the second API key
GEMINI_API_KEYS = []
if GEMINI_API_KEY:
    GEMINI_API_KEYS.append(GEMINI_API_KEY)
if GEMINI_API_KEY_2:
    GEMINI_API_KEYS.append(GEMINI_API_KEY_2)
    
# Log the number of API keys found without exposing them
if len(GEMINI_API_KEYS) == 0:
    logger.warning("No API keys found in environment. Please ensure API keys are set in .env file.")
else:
    logger.info(f"Found {len(GEMINI_API_KEYS)} API key(s) in environment.")
    
API_KEY_INDEX = 0  # Track current API key
MODEL_NAME = os.getenv("MODEL", "gemini/gemini-1.5-flash")

# Rate limiting prevention configuration
MIN_DELAY = float(os.getenv("MIN_DELAY", "2"))  # Get from environment or use default
MAX_DELAY = float(os.getenv("MAX_DELAY", "5"))  # Get from environment or use default
TASK_EXECUTION_DELAY = float(os.getenv("TASK_EXECUTION_DELAY", "5"))  # Get from environment or use default

# Cache directory for processed inputs
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def get_next_api_key():
    """Rotate through available API keys to distribute load (securely without logging keys)"""
    global API_KEY_INDEX
    
    if not GEMINI_API_KEYS:
        logger.warning("No API keys available. Please set API keys in the .env file.")
        return None
        
    key = GEMINI_API_KEYS[API_KEY_INDEX]
    # Move to next key for the next call
    API_KEY_INDEX = (API_KEY_INDEX + 1) % len(GEMINI_API_KEYS)
    
    # Log rotation without exposing the key
    logger.debug(f"Rotated to API key #{API_KEY_INDEX + 1}")
    
    return key

def add_delay(reason="API call"):
    """Add a randomized delay to prevent rate limiting"""
    # Use shorter delay if we have multiple API keys
    actual_delay = random.uniform(MIN_DELAY, MAX_DELAY)
    if len(GEMINI_API_KEYS) > 1:
        actual_delay = actual_delay / 2  # Further reduce delay with multiple keys
        
    logger.info(f"Adding {actual_delay:.2f}s delay for {reason}...")
    time.sleep(actual_delay)
    return actual_delay

class DynamicEducationCrew():
    """Dynamic Educational AI Agents Crew allowing user selection of agents"""

    # Available agent definitions
    AVAILABLE_AGENTS = {
        "learning_planner": {
            "name": "Learning Planner",
            "role": "Educational Planning Specialist",
            "goal": "Create personalized learning roadmaps that align with learner goals and optimize the educational journey",
            "backstory": "As an experienced educational strategist with expertise in curriculum design and personalized learning, you excel at crafting customized learning paths that account for a learner's background, goals, and preferred learning style. You understand how different subjects require different learning approaches.",
            "description": "Creates personalized learning plans and roadmaps tailored to the learner's needs and goals."
        },
        "content_curator": {
            "name": "Content Curator",
            "role": "Educational Content Specialist",
            "goal": "Identify and organize the most relevant, accurate, and engaging learning resources for specific topics",
            "backstory": "With a background in library science and educational content development, you have a talent for finding high-quality learning materials across various formats. You understand that different learners benefit from different content types and know how to evaluate the quality and relevance of educational resources.",
            "description": "Finds and organizes the best learning resources on a given topic from various sources."
        },
        "study_guide_creator": {
            "name": "Study Guide Creator",
            "role": "Educational Content Developer",
            "goal": "Create comprehensive, well-structured study guides that facilitate effective learning",
            "backstory": "You have spent years creating educational materials that help learners master complex subjects. Your study guides are known for being clear, concise, and effective at explaining difficult concepts. You understand how to organize information in a way that facilitates comprehension and retention.",
            "description": "Creates comprehensive study guides with explanations, examples, and practice exercises."
        },
        "assessment_designer": {
            "name": "Assessment Designer",
            "role": "Educational Assessment Specialist",
            "goal": "Design effective assessments that accurately measure learning and provide meaningful feedback",
            "backstory": "With expertise in psychometrics and educational assessment, you design evaluations that accurately measure understanding while providing valuable learning opportunities. You believe that assessments should be learning tools, not just evaluation mechanisms.",
            "description": "Creates quizzes, tests, and other assessments to evaluate understanding of a topic."
        },
        "practical_exercise_developer": {
            "name": "Practical Exercise Developer",
            "role": "Experiential Learning Specialist",
            "goal": "Create hands-on activities and projects that help learners apply theoretical knowledge",
            "backstory": "You strongly believe in learning by doing and have extensive experience designing practical learning experiences across various fields. Your exercises are known for being engaging, relevant, and effective at reinforcing theoretical concepts through application.",
            "description": "Develops hands-on activities, projects, and exercises for applying knowledge."
        },
        "learning_coach": {
            "name": "Learning Coach",
            "role": "Educational Support Specialist",
            "goal": "Provide guidance, motivation, and learning strategies to help students succeed",
            "backstory": "As an experienced educator and learning specialist, you excel at understanding learning challenges and providing personalized support. You have helped countless students overcome obstacles and develop effective study habits and learning techniques.",
            "description": "Provides guidance on study techniques, time management, and overcoming learning obstacles."
        },
        "research_assistant": {
            "name": "Research Assistant",
            "role": "Subject Matter Research Specialist",
            "goal": "Conduct thorough research on specialized topics and compile comprehensive information",
            "backstory": "You're a meticulous researcher with extensive experience in academic and specialized research. You have a talent for finding obscure information, verifying facts, and organizing complex information into coherent structures. Your specialty is diving deep into topics and uncovering details that others might miss.",
            "description": "Conducts in-depth research on topics and compiles comprehensive information from multiple sources."
        },
        "visual_content_analyzer": {
            "name": "Visual Content Analyzer",
            "role": "Visual Learning Specialist",
            "goal": "Analyze and interpret visual information to enhance understanding and learning retention",
            "backstory": "With a background in visual communication and cognitive psychology, you excel at extracting meaning from images, diagrams, charts, and other visual media. You understand how visual processing affects learning and can translate complex visual information into clear verbal explanations and insights.",
            "description": "Analyzes images, diagrams, charts, and other visual content to extract educational value and integrate visual learning into educational materials."
        },
        "web_resource_explorer": {
            "name": "Web Resource Explorer",
            "role": "Digital Content Research Specialist",
            "goal": "Navigate, analyze, and extract valuable educational content from web resources and online platforms",
            "backstory": "As a digital librarian with expertise in web research and content analysis, you excel at finding relevant online resources, evaluating their credibility, and extracting the most valuable information. You're skilled at navigating various online platforms and can synthesize information from diverse sources into cohesive learning materials.",
            "description": "Searches through websites, online databases, and digital repositories to find and analyze relevant content for educational purposes."
        },
        "language_translator": {
            "name": "Language Translator",
            "role": "Multilingual Education Specialist",
            "goal": "Make educational content accessible across language barriers while preserving nuance and context",
            "backstory": "With expertise in multiple languages and linguistics, you specialize in translating educational materials while maintaining their pedagogical effectiveness. You understand cultural nuances and can adapt content appropriately, ensuring that learning materials are equally effective regardless of the language they're presented in.",
            "description": "Translates educational content between languages while preserving educational value and cultural context."
        },
        "multimedia_integration_specialist": {
            "name": "Multimedia Integration Specialist",
            "role": "Multimodal Learning Designer",
            "goal": "Create cohesive learning experiences that leverage multiple media types and sensory channels",
            "backstory": "With a background in instructional design and multimedia production, you excel at combining text, visuals, audio, and interactive elements into effective learning experiences. You understand how different media types complement each other and how to create synergy between them for optimal learning outcomes.",
            "description": "Designs and integrates multimedia components into cohesive educational experiences that engage multiple learning modes."
        },
        "document_analyzer": {
            "name": "Document Analyzer",
            "role": "Document Analysis and Summarization Specialist",
            "goal": "Extract, analyze, and summarize key information from complex documents including PDFs, presentations, and academic papers",
            "backstory": "With expertise in document analysis, information extraction, and technical writing, you excel at identifying the core concepts and important details in any type of document. You're skilled at distilling complex information into clear, concise summaries and creating structured notes that capture the essence of the content while highlighting key points.",
            "description": "Analyzes documents like PDFs and presentations to extract key information and create comprehensive summaries and structured notes."
        }
    }

    # Available task definitions
    AVAILABLE_TASKS = {
        "create_learning_plan": {
            "name": "Create Learning Plan",
            "agent": "learning_planner",
            "description": "Create a personalized learning plan for {subject}, focusing on {topic}. The plan should account for {learning_style} as the preferred learning style and include clear learning objectives, suggested timeline, and milestones.",
            "expected_output": "A comprehensive learning plan document with objectives, timeline, and milestones.",
            "output_file": "personalized_learning_plan.md",
            "dependencies": []
        },
        "curate_learning_resources": {
            "name": "Curate Learning Resources",
            "agent": "content_curator",
            "description": "Find and evaluate the best learning resources for {subject}, specifically focusing on {topic}. Consider {learning_style} when selecting resources. Include a variety of resource types (books, online courses, videos, etc.) with brief descriptions of each.",
            "expected_output": "A curated list of learning resources organized by type, with descriptions and quality ratings.",
            "output_file": "curated_learning_resources.md",
            "dependencies": ["create_learning_plan"]
        },
        "create_study_guide": {
            "name": "Create Study Guide",
            "agent": "study_guide_creator",
            "description": "Create a comprehensive study guide for {topic} within {subject}. The guide should align with {learning_style} and include clear explanations, examples, and key concepts. Structure the guide in a logical progression for optimal learning.",
            "expected_output": "A detailed study guide document with explanations, examples, and key concepts.",
            "output_file": "comprehensive_study_guide.md",
            "dependencies": ["create_learning_plan", "curate_learning_resources"]
        },
        "design_assessment": {
            "name": "Design Assessment",
            "agent": "assessment_designer",
            "description": "Create an assessment for {topic} within {subject} that effectively evaluates understanding of key concepts. Include a variety of question types and provide an answer key with explanations. Consider {learning_style} in your design.",
            "expected_output": "An assessment document with various question types and an answer key with explanations.",
            "output_file": "topic_assessment.md",
            "dependencies": ["create_study_guide"]
        },
        "develop_practical_exercises": {
            "name": "Develop Practical Exercises",
            "agent": "practical_exercise_developer",
            "description": "Develop hands-on exercises and projects for {topic} within {subject} that allow learners to apply theoretical knowledge. The activities should be aligned with {learning_style} and include clear instructions, required materials/tools, and expected outcomes.",
            "expected_output": "A set of practical exercises and projects with instructions and expected outcomes.",
            "output_file": "practical_exercises.md",
            "dependencies": ["create_learning_plan", "create_study_guide"]
        },
        "provide_learning_strategies": {
            "name": "Provide Learning Strategies",
            "agent": "learning_coach",
            "description": "Provide strategies and techniques for effectively learning {topic} within {subject}, tailored to {learning_style}. Include approaches for managing challenging concepts, effective study techniques, and ways to maintain motivation throughout the learning process.",
            "expected_output": "A guide with learning strategies, study techniques, and motivational approaches.",
            "output_file": "learning_strategies_guide.md",
            "dependencies": ["create_learning_plan"]
        },
        "research_topic": {
            "name": "Research Topic",
            "agent": "research_assistant",
            "description": "Conduct thorough research on {topic} within {subject}, focusing on gathering comprehensive information from multiple sources. Include historical context, key theories/concepts, current developments, and notable contributors to the field.",
            "expected_output": "A detailed research document with comprehensive information about the topic, including historical context, key concepts, and current understanding.",
            "output_file": "topic_research.md",
            "dependencies": []
        },
        "compile_comprehensive_guide": {
            "name": "Compile Comprehensive Guide",
            "agent": "study_guide_creator",
            "description": "Create a comprehensive guide about {topic} within {subject} that covers all aspects of the topic. The guide should be thorough, well-structured, and include detailed explanations, examples, and relevant information from the research phase.",
            "expected_output": "A comprehensive guide that covers all aspects of the topic in detail, presented in a clear and organized manner.",
            "output_file": "comprehensive_guide.md",
            "dependencies": ["research_topic"]
        },
        "create_reference_materials": {
            "name": "Create Reference Materials",
            "agent": "content_curator",
            "description": "Compile a comprehensive set of reference materials for {topic} within {subject}. Include a bibliography of key resources, a glossary of important terms, a timeline of developments if relevant, and a list of influential figures in the field.",
            "expected_output": "A set of reference materials including bibliography, glossary, and other relevant reference information.",
            "output_file": "reference_materials.md",
            "dependencies": ["research_topic", "compile_comprehensive_guide"]
        },
        "analyze_visual_content": {
            "name": "Analyze Visual Content",
            "agent": "visual_content_analyzer",
            "description": "Analyze important visual content related to {topic} within {subject}. Identify key diagrams, images, charts, and other visual materials that help explain concepts. Provide detailed analysis of what these visuals convey, their educational value, and how they can enhance understanding of the topic.",
            "expected_output": "A detailed analysis of visual content with explanations of their significance, educational value, and how they illustrate key concepts.",
            "output_file": "visual_content_analysis.md",
            "dependencies": ["research_topic"]
        },
        "explore_web_resources": {
            "name": "Explore Web Resources",
            "agent": "web_resource_explorer",
            "description": "Search for and analyze relevant web-based resources for {topic} within {subject}. Evaluate online courses, interactive websites, video tutorials, forums, and other digital resources. Provide URLs, summaries of content, credibility assessments, and recommendations for how to use each resource.",
            "expected_output": "A catalog of web resources with URLs, descriptions, credibility ratings, and usage recommendations for learning the topic.",
            "output_file": "web_resources_catalog.md",
            "dependencies": ["research_topic"]
        },
        "translate_key_content": {
            "name": "Translate Key Content",
            "agent": "language_translator",
            "description": "Identify and translate key content about {topic} within {subject} that exists in other languages but would be valuable for learning. Focus on important concepts, explanations, or examples that offer unique perspectives or are not readily available in the learner's primary language.",
            "expected_output": "Translated content with original sources cited, notes on cultural context, and explanations of how these materials complement existing resources.",
            "output_file": "translated_content.md",
            "dependencies": ["research_topic", "explore_web_resources"]
        },
        "design_multimedia_learning_experience": {
            "name": "Design Multimedia Learning Experience",
            "agent": "multimedia_integration_specialist",
            "description": "Create a cohesive multimedia learning experience for {topic} within {subject} that integrates text, visuals, interactive elements, and potentially audio components. Design a learning flow that leverages multiple sensory channels to enhance understanding and retention, considering {learning_style} preferences.",
            "expected_output": "A detailed plan for a multimedia learning experience with descriptions of components, their sequence, integration points, and guidance for implementation.",
            "output_file": "multimedia_learning_plan.md",
            "dependencies": ["create_learning_plan", "analyze_visual_content", "explore_web_resources"]
        },
        "create_visual_study_materials": {
            "name": "Create Visual Study Materials",
            "agent": "visual_content_analyzer",
            "description": "Design visual study materials (concept maps, diagrams, flowcharts, etc.) for {topic} within {subject} that help visualize key concepts, relationships, and processes. These materials should be tailored to {learning_style} preferences and designed to complement textual explanations.",
            "expected_output": "A set of visual study materials with explanations of how to use them effectively for learning the topic.",
            "output_file": "visual_study_materials.md",
            "dependencies": ["research_topic", "create_study_guide"]
        },
        "develop_multilingual_glossary": {
            "name": "Develop Multilingual Glossary",
            "agent": "language_translator",
            "description": "Create a multilingual glossary of key terms and concepts for {topic} within {subject}. Include definitions in multiple languages, pronunciation guides, etymological information, and notes on any cross-cultural differences in usage or interpretation.",
            "expected_output": "A comprehensive multilingual glossary that facilitates understanding of terminology across language barriers.",
            "output_file": "multilingual_glossary.md",
            "dependencies": ["research_topic"]
        },
        "analyze_document": {
            "name": "Analyze Document",
            "agent": "document_analyzer",
            "description": "Analyze the provided document on {topic} within {subject}, extracting key concepts, main arguments, supporting evidence, and important details. Focus on these document(s): {document_paths} if available, otherwise use the information in {additional_content}. Identify the document's structure, organization, and information hierarchy.",
            "expected_output": "A comprehensive analysis of the document's content, structure, and key information.",
            "output_file": "document_analysis.md",
            "dependencies": []
        },
        "create_document_summary": {
            "name": "Create Document Summary",
            "agent": "document_analyzer",
            "description": "Create a concise yet comprehensive summary of the document related to {topic} within {subject}. Focus on these document(s): {document_paths} if available, otherwise use the information in {additional_content}. The summary should capture the main ideas, key findings, and important conclusions in a fraction of the original length.",
            "expected_output": "A clear and concise summary of the document that captures all essential information.",
            "output_file": "document_summary.md",
            "dependencies": ["analyze_document"]
        },
        "generate_study_notes": {
            "name": "Generate Study Notes",
            "agent": "document_analyzer",
            "description": "Create detailed study notes from the document on {topic} within {subject}, optimized for {learning_style}. Focus on these document(s): {document_paths} if available, otherwise use the information in {additional_content}. Organize information in a structured format with clear headings, bullet points, and emphasis on key concepts. Include visual elements like diagrams or tables where appropriate.",
            "expected_output": "Well-structured study notes that organize the document's content for effective learning and review.",
            "output_file": "study_notes.md",
            "dependencies": ["analyze_document", "create_document_summary"]
        },
        "create_concept_map": {
            "name": "Create Concept Map",
            "agent": "visual_content_analyzer",
            "description": "Create a concept map or mind map for {topic} within {subject}, based on the analyzed document. Focus on these document(s): {document_paths} if available, otherwise use the information in {additional_content}. The concept map should visually represent key concepts and their relationships, showing how ideas connect and relate to each other.",
            "expected_output": "A textual description of a concept map with nodes, connections, and explanations of relationships between concepts.",
            "output_file": "concept_map.md",
            "dependencies": ["analyze_document"]
        },
        "generate_practice_questions": {
            "name": "Generate Practice Questions",
            "agent": "assessment_designer",
            "description": "Create practice questions and self-assessment materials based on the document about {topic} within {subject}. Focus on these document(s): {document_paths} if available, otherwise use the information in {additional_content}. Include a variety of question types (multiple choice, short answer, etc.) with answers and explanations to help reinforce understanding and recall of the material.",
            "expected_output": "A set of practice questions with answers and explanations, designed to test understanding of the document's content.",
            "output_file": "practice_questions.md",
            "dependencies": ["analyze_document", "create_document_summary"]
        }
    }

    # Recommended workflows
    RECOMMENDED_WORKFLOWS = {
        "standard": {
            "name": "Comprehensive Learning",
            "description": "A comprehensive educational experience with structured learning and assessment",
            "agents": ["learning_planner", "content_curator", "assessment_designer"],
            "tasks": ["curate_learning_resources", "create_learning_plan", "create_study_guide", "design_assessment"]
        },
        "basic": {
            "name": "Basic Learning",
            "description": "A simplified learning experience focusing on core content and study materials",
            "agents": ["learning_planner", "content_curator"],
            "tasks": ["curate_learning_resources", "create_learning_plan", "create_study_guide"]
        },
        "practical": {
            "name": "Practical Application",
            "description": "Learning with a focus on practical projects and exercises",
            "agents": ["learning_planner", "content_curator", "practical_exercise_developer", "research_assistant"],
            "tasks": ["curate_learning_resources", "research_topic", "create_study_guide", "develop_practical_exercises"]
        },
        "visual_learning": {
            "name": "Visual Learning",
            "description": "An approach that prioritizes visual content and multimedia resources",
            "agents": ["learning_planner", "content_curator", "visual_content_analyzer", "research_assistant"],
            "tasks": ["curate_learning_resources", "research_topic", "create_visual_study_materials", "create_study_guide"]
        },
        "web_enhanced": {
            "name": "Web-Enhanced Learning",
            "description": "Learning enriched with curated web resources and multimedia content",
            "agents": ["learning_planner", "content_curator", "web_resource_explorer", "research_assistant"],
            "tasks": ["curate_learning_resources", "research_topic", "explore_web_resources", "create_study_guide"]
        },
        "multimedia": {
            "name": "Multimedia Learning",
            "description": "A rich educational experience using various media formats",
            "agents": ["learning_planner", "content_curator", "visual_content_analyzer", "web_resource_explorer"],
            "tasks": ["curate_learning_resources", "research_topic", "explore_web_resources", "create_study_guide"]
        },
        "multilingual": {
            "name": "Multilingual Learning",
            "description": "Educational content with multilingual support and translation",
            "agents": ["learning_planner", "content_curator", "language_translator"],
            "tasks": ["curate_learning_resources", "create_study_guide", "translate_key_content"]
        },
        "research": {
            "name": "Research-Focused Learning",
            "description": "In-depth exploration of a topic with research focus",
            "agents": ["learning_planner", "content_curator", "research_assistant"],
            "tasks": ["curate_learning_resources", "research_topic", "create_study_guide"]
        },
        "custom": {
            "name": "Custom Workflow",
            "description": "A fully customized learning workflow with your choice of agents and tasks",
            "agents": [],
            "tasks": []
        },
        "document_summarizer": {
            "name": "Document Summarizer",
            "description": "Analyze, summarize, and create study notes from PDF or PPT documents",
            "agents": ["document_analyzer", "visual_content_analyzer"],
            "tasks": ["analyze_document", "create_document_summary", "generate_study_notes", "create_concept_map"]
        },
        "comprehensive_notes": {
            "name": "Comprehensive Notes Creator",
            "description": "Create complete study materials including summaries, notes, concept maps, and practice questions from documents",
            "agents": ["document_analyzer", "visual_content_analyzer", "assessment_designer"],
            "tasks": ["analyze_document", "create_document_summary", "generate_study_notes", "create_concept_map", "generate_practice_questions"]
        }
    }

    def __init__(self, selected_workflow="standard", selected_agents=None, selected_tasks=None, custom_inputs=None, verbose=True):
        """
        Initialize the Dynamic Education Crew
        
        Args:
            selected_workflow (str): Key of the workflow to use
            selected_agents (list): List of agent keys to use (optional, will be derived from workflow if not provided)
            selected_tasks (list): List of task keys to execute (optional, will be derived from workflow if not provided)
            custom_inputs (dict): Custom inputs for the tasks
            verbose (bool): Whether to enable verbose output
        """
        # Initialize logger
        self.logger = logging.getLogger('DynamicEducationCrew')
        
        # Initialize empty fields
        self.tasks = {}
        self.agents = {}
        self.errors = []
        self.warnings = []
        self.verbose = verbose
        
        # Save custom inputs
        self.custom_inputs = custom_inputs or {}
        
        # Record workflow selection
        self.selected_workflow = selected_workflow
        self.logger.info(f"Initializing Dynamic Education Crew with workflow: {selected_workflow}")
        
        try:
            # Preprocess multimodal inputs if any
            self._preprocess_multimodal_inputs()
            
            # If no specific agents/tasks provided, get from selected workflow
            if selected_workflow != "custom" and (selected_agents is None or selected_tasks is None):
                if selected_workflow in self.RECOMMENDED_WORKFLOWS:
                    if selected_agents is None:
                        selected_agents = self.RECOMMENDED_WORKFLOWS[selected_workflow]["agents"].copy()
                    if selected_tasks is None:
                        selected_tasks = self.RECOMMENDED_WORKFLOWS[selected_workflow]["tasks"].copy()
                else:
                    self.logger.warning(f"Workflow '{selected_workflow}' not found, falling back to standard")
                    selected_workflow = "standard"
                    selected_agents = self.RECOMMENDED_WORKFLOWS["standard"]["agents"].copy()
                    selected_tasks = self.RECOMMENDED_WORKFLOWS["standard"]["tasks"].copy()
            
            # Ensure all dependencies are included
            if selected_tasks:
                selected_tasks = self._ensure_dependencies(selected_tasks)
                self.logger.info(f"Final task list after ensuring dependencies: {', '.join(selected_tasks)}")
            
            # Ensure all required agents are included
            if selected_tasks and selected_agents:
                required_agents = self.get_required_agents_for_tasks(selected_tasks)
                for agent_key in required_agents:
                    if agent_key not in selected_agents:
                        selected_agents.append(agent_key)
                self.logger.info(f"Final agent list after ensuring dependencies: {', '.join(selected_agents)}")
            
            # Store for future use
            self.selected_agents_keys = selected_agents or []
            self.selected_tasks_keys = selected_tasks or []
            
        except Exception as e:
            self.logger.error(f"Error during initialization: {str(e)}")
            self.errors.append({
                "stage": "initialization",
                "error": str(e)
            })
    
    def _add_required_agents_for_tasks(self):
        """
        Scan selected tasks and add any required agents that aren't already included
        """
        required_agents = set()
        
        for task_key in self.selected_tasks_keys:
            if task_key in self.AVAILABLE_TASKS:
                agent_key = self.AVAILABLE_TASKS[task_key]["agent"]
                required_agents.add(agent_key)
        
        # Update selected agents with the required ones
        for agent_key in required_agents:
            if agent_key not in self.selected_agents_keys:
                self.selected_agents_keys.append(agent_key)
                logger.info(f"Added required agent '{agent_key}' for selected tasks")
                
    def _ensure_all_dependencies_included(self):
        """
        Scan selected tasks and add any missing dependency tasks
        """
        if not self.selected_tasks_keys:
            return
            
        # Keep track of tasks that have been processed
        processed_tasks = set()
        
        # Keep iterating until no new dependencies are found
        while True:
            new_dependencies_found = False
            
            # Check each task for dependencies
            for task_key in list(self.selected_tasks_keys):  # Use list() to create a copy
                if task_key in processed_tasks:
                    continue
                    
                if task_key not in self.AVAILABLE_TASKS:
                    continue
                    
                # Get task dependencies
                dependencies = self.AVAILABLE_TASKS[task_key]["dependencies"]
                
                # Add any missing dependencies
                for dep_key in dependencies:
                    if dep_key not in self.selected_tasks_keys:
                        self.selected_tasks_keys.append(dep_key)
                        new_dependencies_found = True
                        logger.info(f"Added required dependency task '{dep_key}' for task '{task_key}'")
                        
                        # Also ensure we have the agent for this dependency
                        if dep_key in self.AVAILABLE_TASKS:
                            agent_key = self.AVAILABLE_TASKS[dep_key]["agent"]
                            if agent_key not in self.selected_agents_keys:
                                self.selected_agents_keys.append(agent_key)
                                logger.info(f"Added required agent '{agent_key}' for dependency task '{dep_key}'")
                
                processed_tasks.add(task_key)
            
            # If no new dependencies were found, we're done
            if not new_dependencies_found:
                break
                
        logger.info(f"Final task list after ensuring dependencies: {', '.join(self.selected_tasks_keys)}")
        logger.info(f"Final agent list after ensuring dependencies: {', '.join(self.selected_agents_keys)}")

    def _validate_workflow(self):
        """
        Validate the workflow to ensure all selected agents and tasks exist and dependencies are met
        """
        logger.info("Validating workflow")
        
        if not self.agents:
            raise ValueError("No agents selected. Please select at least one agent.")
            
        if not self.selected_tasks_keys:
            raise ValueError("No tasks selected. Please select at least one task.")
            
        # Get all task dependencies in selected tasks
        all_dependencies = set()
        for task_key in self.selected_tasks_keys:
            if task_key in self.AVAILABLE_TASKS:
                deps = self.AVAILABLE_TASKS[task_key]["dependencies"]
                all_dependencies.update(deps)
        
        # Check that all dependencies are in the selected tasks
        missing_dependencies = []
        for task_key in self.selected_tasks_keys:
            if task_key not in self.AVAILABLE_TASKS:
                raise ValueError(f"Task '{task_key}' not found in available tasks")
                
            task_config = self.AVAILABLE_TASKS[task_key]
            agent_key = task_config["agent"]
            
            if agent_key not in self.agents:
                raise ValueError(f"Agent '{agent_key}' required for task '{task_key}' is not selected")
            
            # Check that all dependencies are selected
            for dep_key in task_config["dependencies"]:
                if dep_key not in self.selected_tasks_keys:
                    missing_dependencies.append((task_key, dep_key))
                    logger.warning(f"Dependency '{dep_key}' for task '{task_key}' is not in selected tasks")
                    self.errors.append({
                        "phase": "workflow_validation", 
                        "error": f"Dependency '{dep_key}' for task '{task_key}' is not selected"
                    })
                    
        # If there are missing dependencies, suggest a fix
        if missing_dependencies:
            missing_deps_str = ", ".join([f"'{dep}' for '{task}'" for task, dep in missing_dependencies])
            logger.warning(f"Missing dependencies: {missing_deps_str}")
            logger.warning("Consider adding these dependencies to your workflow or using _ensure_all_dependencies_included() method before validation")
        
        # Check for circular dependencies in task configuration
        graph = {task_key: self.AVAILABLE_TASKS[task_key]["dependencies"] 
                 for task_key in self.selected_tasks_keys}
        
        visited = set()
        temp_visited = set()
        
        def has_circular_dependency(node):
            """Check if a task has circular dependencies in the configuration"""
            if node in temp_visited:
                return True
                
            if node in visited:
                return False
                
            temp_visited.add(node)
            
            # Check all dependencies
            for dep in graph[node]:
                if dep in graph and has_circular_dependency(dep):
                    return True
                    
            temp_visited.remove(node)
            visited.add(node)
            return False
            
        # Check each task
        for task_key in graph:
            if has_circular_dependency(task_key):
                cycle_path = " -> ".join(list(temp_visited) + [task_key])
                raise ValueError(f"Circular dependency detected in workflow: {cycle_path}")
                
        logger.info("Workflow validation complete")
    
    def _preprocess_multimodal_inputs(self):
        """
        Preprocess multimodal inputs to extract and cache relevant information
        """
        additional_content = self.custom_inputs.get('additional_content', '')
        
        if not additional_content:
            return
            
        logger.info("Preprocessing multimodal inputs")
        
        # Initialize input cache if it doesn't exist
        if not hasattr(self, 'input_cache'):
            self.input_cache = {}
        
        # Check for image URLs
        if any(ext in additional_content.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
            logger.info("Detected image URLs in input - preparing for visual analysis")
            self.custom_inputs['has_image_content'] = True
            
            # Create cache key for this content
            cache_key = f"img_{hash(additional_content)}"
            cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
            
            # Check if we already processed this content
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        self.input_cache['image_analysis'] = json.load(f)
                    logger.info("Loaded image analysis from cache")
                except Exception as e:
                    logger.warning(f"Could not load image cache: {str(e)}")
        
        # Check for document files (PDF, PPT, PPTX, etc.)
        document_extensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.rtf', '.odt']
        if any(ext in additional_content.lower() for ext in document_extensions):
            logger.info("Detected document files in input - preparing for document analysis")
            self.custom_inputs['has_document_content'] = True
            
            # Extract document paths for easier access
            document_paths = self._extract_document_paths(additional_content)
            self.custom_inputs['document_paths'] = document_paths
            logger.info(f"Extracted {len(document_paths)} document paths for analysis")
            
            # Determine document types for specialized processing
            has_pdf = any(path.lower().endswith('.pdf') for path in document_paths)
            has_presentation = any(path.lower().endswith(('.ppt', '.pptx')) for path in document_paths)
            has_word = any(path.lower().endswith(('.doc', '.docx', '.rtf', '.odt')) for path in document_paths)
            
            if has_pdf:
                logger.info("PDF documents detected - will enable PDF-specific analysis features")
                self.custom_inputs['has_pdf_content'] = True
                
            if has_presentation:
                logger.info("Presentation documents detected - will enable slide deck analysis features")
                self.custom_inputs['has_presentation_content'] = True
                
            if has_word:
                logger.info("Word documents detected - will enable text document analysis features")
                self.custom_inputs['has_word_content'] = True
            
            # Create cache key for this content
            cache_key = f"doc_{hash(str(document_paths))}"
            cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
            
            # Check if we already processed this content
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        self.input_cache['document_analysis'] = json.load(f)
                    logger.info("Loaded document analysis from cache")
                except Exception as e:
                    logger.warning(f"Could not load document cache: {str(e)}")
        
        # Check for web URLs
        if "http" in additional_content and "://" in additional_content:
            logger.info("Detected web URLs in input - preparing for web content extraction")
            self.custom_inputs['has_web_content'] = True
            
            # Create cache key for this content
            cache_key = f"web_{hash(additional_content)}"
            cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
            
            # Check if we already processed this content
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        self.input_cache['web_content'] = json.load(f)
                    logger.info("Loaded web content from cache")
                except Exception as e:
                    logger.warning(f"Could not load web cache: {str(e)}")
        
        # Check for potential foreign language content
        if len(additional_content.split()) > 5:  # Only check if there's substantial text
            non_ascii_ratio = sum(1 for c in additional_content if ord(c) > 127) / len(additional_content)
            if non_ascii_ratio > 0.2:  # If more than 20% non-ASCII characters
                logger.info("Detected potential foreign language content - preparing for translation")
                self.custom_inputs['has_foreign_text'] = True

    def _create_agents(self, selected_agents):
        """
        Create agent instances based on the selected agent keys
        
        Args:
            selected_agents (list): List of agent keys
            
        Returns:
            dict: Dictionary of agent instances by agent key
        """
        self.logger.info(f"Creating {len(selected_agents)} agents")
        
        agents = {}
        
        for agent_key in selected_agents:
            try:
                # Check if agent exists
                if agent_key not in self.AVAILABLE_AGENTS:
                    self.logger.error(f"Agent {agent_key} not found in available agents")
                    continue
                
                agent_info = self.AVAILABLE_AGENTS[agent_key]
                agent_name = agent_info["name"]
                agent_role = agent_info["role"]
                agent_goal = agent_info["goal"]
                agent_backstory = agent_info["backstory"]
                
                # Create enhanced versions of goal and backstory with custom inputs
                if self.custom_inputs:
                    subject = self.custom_inputs.get("subject", "the subject")
                    topic = self.custom_inputs.get("topic", "the topic")
                    
                    agent_goal = agent_goal.replace("[SUBJECT]", subject).replace("[TOPIC]", topic)
                    agent_backstory = agent_backstory.replace("[SUBJECT]", subject).replace("[TOPIC]", topic)
                
                # Create the agent (API key is handled globally by crew)
                agent = Agent(
                    role=agent_role,
                    goal=agent_goal,
                    backstory=agent_backstory,
                    verbose=self.verbose,
                    allow_delegation=False,  # Disable delegation to avoid unhashable type error
                    llm=MODEL_NAME  # Specify the LLM to use
                    # No direct API key assignment - this is now handled at the crew level
                )
                
                agents[agent_key] = agent
                self.logger.info(f"Created agent: {agent_name}")
                
            except Exception as e:
                self.logger.error(f"Error creating agent {agent_key}: {str(e)}")
        
        return agents

    def _create_tasks(self, selected_tasks, agents) -> List[Task]:
        """
        Create the selected tasks with enhanced multimodal input handling and correct dependency handling
        for compatibility with the latest crewAI API.
        
        Returns:
            List[Task]: List of created tasks in topological order
        """
        logger.info("Creating and organizing tasks")
        
        # First pass: Create a dictionary of tasks without dependencies
        preliminary_tasks = {}
        for task_key in selected_tasks:
            if task_key not in self.AVAILABLE_TASKS:
                logger.warning(f"Task '{task_key}' not found in available tasks, skipping")
                self.errors.append({"phase": "task_creation", "error": f"Task '{task_key}' not found"})
                continue
                
            task_config = self.AVAILABLE_TASKS[task_key]
            agent_key = task_config["agent"]
            
            if agent_key not in agents:
                logger.warning(f"Agent '{agent_key}' for task '{task_key}' not available, skipping task")
                self.errors.append({
                    "phase": "task_creation", 
                    "error": f"Required agent '{agent_key}' for task '{task_key}' not available"
                })
                continue
            
            try:
                # Format task description
                task_description = task_config["description"]
                
                # Enhance task descriptions with multimodal content if available
                if self.custom_inputs.get('has_image_content') and task_key in [
                    "analyze_visual_content", 
                    "create_visual_study_materials", 
                    "design_multimedia_learning_experience"
                ]:
                    image_urls = [url.strip() for url in self.custom_inputs.get('additional_content', '').split() 
                                  if any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif'])]
                    if image_urls:
                        task_description += f"\n\nAnalyze these images as part of your task: {' '.join(image_urls)}"
                
                if self.custom_inputs.get('has_web_content') and task_key in [
                    "explore_web_resources",
                    "curate_learning_resources",
                    "research_topic"
                ]:
                    web_urls = [url.strip() for url in self.custom_inputs.get('additional_content', '').split() 
                                if "http" in url and "://" in url]
                    if web_urls:
                        task_description += f"\n\nInclude analysis of these web resources: {' '.join(web_urls)}"
                
                if self.custom_inputs.get('has_foreign_text') and task_key in [
                    "translate_key_content",
                    "develop_multilingual_glossary"
                ]:
                    task_description += f"\n\nAnalyze and translate this foreign text as part of your task: '{self.custom_inputs.get('additional_content', '')[:500]}'"
                
                # Add code snippets for programming-related tasks
                if "programming" in self.custom_inputs.get('subject', '').lower() and task_key in [
                    "create_study_guide",
                    "develop_practical_exercises"
                ]:
                    task_description += "\n\nInclude code examples and explanations as part of your educational materials."
                
                # Format the task description with custom inputs
                formatted_description = task_description.format(**self.custom_inputs)
                
                logger.info(f"Preparing task: {task_config['name']}")
                
                # Store all necessary information for this task, but don't create it yet
                preliminary_tasks[task_key] = {
                    "description": formatted_description,
                    "expected_output": task_config["expected_output"],
                    "agent": agents[agent_key],
                    "output_file": task_config.get("output_file"),
                    "dependencies": task_config["dependencies"]
                }
                
            except Exception as e:
                logger.error(f"Error preparing task '{task_key}': {str(e)}")
                self.errors.append({"phase": "task_creation", "error": f"Error preparing '{task_key}': {str(e)}"})
        
        if not preliminary_tasks:
            logger.error("No tasks were successfully prepared")
            raise ValueError("Failed to prepare any tasks. Check the errors log for details.")
        
        # Second pass: Create tasks with dependencies
        final_tasks = {}
        
        # First create tasks with no dependencies
        for task_key, task_info in preliminary_tasks.items():
            if not task_info["dependencies"]:
                logger.info(f"Creating task with no dependencies: {task_key}")
                try:
                    task = Task(
                        description=task_info["description"],
                        expected_output=task_info["expected_output"],
                        agent=task_info["agent"],
                        output_file=task_info["output_file"]
                    )
                    final_tasks[task_key] = task
                    add_delay(f"created task {task_key}")
                except Exception as e:
                    logger.error(f"Error creating task '{task_key}': {str(e)}")
                    self.errors.append({"phase": "task_creation", "error": f"Error creating '{task_key}': {str(e)}"})
        
        # Then create tasks with dependencies, in order of dependency depth
        remaining_tasks = {k: v for k, v in preliminary_tasks.items() if v["dependencies"]}
        max_iterations = len(remaining_tasks) + 1  # Prevent infinite loops
        
        for _ in range(max_iterations):
            if not remaining_tasks:
                break
                
            tasks_created_this_round = False
            
            for task_key, task_info in list(remaining_tasks.items()):
                # Check if all dependencies are available in final_tasks
                dependencies_available = all(dep in final_tasks for dep in task_info["dependencies"])
                
                if dependencies_available:
                    logger.info(f"Creating task with dependencies: {task_key}")
                    try:
                        # Get the actual dependency task objects
                        dependency_tasks = [final_tasks[dep] for dep in task_info["dependencies"]]
                        
                        task = Task(
                            description=task_info["description"],
                            expected_output=task_info["expected_output"],
                            agent=task_info["agent"],
                            output_file=task_info["output_file"],
                            context=[],  # Empty context
                            dependencies=dependency_tasks  # Pass dependencies when creating the task
                        )
                        
                        final_tasks[task_key] = task
                        del remaining_tasks[task_key]
                        tasks_created_this_round = True
                        add_delay(f"created task {task_key}")
                    except Exception as e:
                        logger.error(f"Error creating task '{task_key}': {str(e)}")
                        self.errors.append({"phase": "task_creation", "error": f"Error creating '{task_key}': {str(e)}"})
                        del remaining_tasks[task_key]  # Skip this task
            
            # If we didn't create any tasks this round, we might have circular dependencies
            if not tasks_created_this_round and remaining_tasks:
                missing_deps = []
                for task_key, task_info in remaining_tasks.items():
                    for dep in task_info["dependencies"]:
                        if dep not in final_tasks:
                            missing_deps.append((task_key, dep))
                
                logger.error(f"Could not resolve dependencies for these tasks: {', '.join(remaining_tasks.keys())}")
                for task, dep in missing_deps:
                    logger.error(f"Task '{task}' depends on '{dep}' which is not available")
                
                break
        
        # Convert to list and return
        tasks_list = list(final_tasks.values())
        logger.info(f"Successfully created {len(tasks_list)} tasks")
        return tasks_list

    def get_errors(self):
        """
        Return any errors encountered during execution
        
        Returns:
            List[Dict]: List of error dictionaries with phase and error message
        """
        return self.errors
    
    @classmethod
    def get_workflow_info(cls) -> Dict[str, Any]:
        """
        Get information about available agents, tasks, and workflows
        
        Returns:
            Dict[str, Any]: Dictionary with agents, tasks, and workflows information
        """
        return {
            "agents": cls.AVAILABLE_AGENTS,
            "tasks": cls.AVAILABLE_TASKS,
            "workflows": cls.RECOMMENDED_WORKFLOWS
        }
    
    @classmethod
    def get_workflow_recommendations(cls, subject):
        """
        Get workflow recommendations based on the subject
        
        Args:
            subject (str): The subject being studied
            
        Returns:
            Dict[str, Any]: Dictionary with recommended workflows and explanations
        """
        recommendations = {}
        subject_lower = subject.lower()
        
        # Basic workflow is always recommended for quick results
        recommendations["basic"] = {
            "name": cls.RECOMMENDED_WORKFLOWS["basic"]["name"],
            "description": cls.RECOMMENDED_WORKFLOWS["basic"]["description"],
            "explanation": "Creates a simple learning plan with key resources and a study guide. Good for quick results."
        }
        
        # For programming and technical subjects
        if any(term in subject_lower for term in ["programming", "coding", "development", "engineering", "computer science"]):
            recommendations["practical"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["practical"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["practical"]["description"],
                "explanation": "Includes practical exercises and hands-on projects. Ideal for programming topics."
            }
            recommendations["multimedia"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["multimedia"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["multimedia"]["description"],
                "explanation": "Incorporates visual diagrams and code examples with multimedia integration. Perfect for learning programming concepts."
            }
        
        # For language and humanities subjects
        if any(term in subject_lower for term in ["language", "literature", "history", "philosophy", "humanities"]):
            recommendations["comprehensive"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["comprehensive"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["comprehensive"]["description"],
                "explanation": "Provides in-depth learning with research, assessments, and strategies. Great for humanities."
            }
            recommendations["multilingual"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["multilingual"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["multilingual"]["description"],
                "explanation": "Includes translation components and multilingual resources. Excellent for language-related subjects."
            }
        
        # For subjects with visual components
        if any(term in subject_lower for term in ["art", "design", "photography", "visual", "graphic"]):
            recommendations["visual_learning"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["visual_learning"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["visual_learning"]["description"],
                "explanation": "Emphasizes visual analysis and multimedia learning experiences. Ideal for visual subjects."
            }
        
        # For research-heavy subjects
        if any(term in subject_lower for term in ["science", "research", "biology", "physics", "chemistry", "mathematics"]):
            recommendations["research"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["research"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["research"]["description"],
                "explanation": "Focuses on in-depth research and content curation. Excellent for scientific and academic topics."
            }
            recommendations["standard"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["standard"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["standard"]["description"],
                "explanation": "Creates detailed information guides and comprehensive learning materials. Great for exploring topics deeply."
            }
        
        # For document analysis and note-taking scenarios
        if any(term in subject_lower for term in ["lecture", "notes", "document", "paper", "presentation", "pdf", "summary", "study", "course", "exam", "class", "textbook"]):
            recommendations["document_summarizer"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["document_summarizer"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["document_summarizer"]["description"],
                "explanation": "Analyzes documents like PDFs or presentations and creates concise summaries and study notes. Ideal for reviewing lecture materials and course content."
            }
            recommendations["comprehensive_notes"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["comprehensive_notes"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["comprehensive_notes"]["description"],
                "explanation": "Creates complete study materials from documents including summaries, structured notes, concept maps, and practice questions. Perfect for exam preparation."
            }
        
        # Always recommend document analysis workflows if subject contains academic or study terms
        if any(term in subject_lower for term in ["academic", "study", "university", "college", "school", "learning", "education", "course", "lecture"]):
            recommendations["document_summarizer"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["document_summarizer"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["document_summarizer"]["description"],
                "explanation": "Analyzes documents like PDFs or presentations and creates helpful study materials. Excellent for academic contexts."
            }
        
        # Standard workflow is a good default for most subjects
        if len(recommendations) < 3:
            recommendations["standard"] = {
                "name": cls.RECOMMENDED_WORKFLOWS["standard"]["name"],
                "description": cls.RECOMMENDED_WORKFLOWS["standard"]["description"],
                "explanation": "A balanced workflow with learning plans, content, and study materials. Good for most subjects."
            }
        
        # Always offer the custom option
        recommendations["custom"] = {
            "name": cls.RECOMMENDED_WORKFLOWS["custom"]["name"],
            "description": cls.RECOMMENDED_WORKFLOWS["custom"]["description"],
            "explanation": "Build your own custom workflow by selecting specific agents and tasks."
        }
        
        return recommendations
    
    @classmethod
    def print_workflow_options(cls):
        """Print available workflow options to the console"""
        print("\nAVAILABLE WORKFLOWS:")
        print("====================")
        
        for key, workflow in cls.RECOMMENDED_WORKFLOWS.items():
            print(f"\n{workflow['name']} ('{key}')")
            print(f"  {workflow['description']}")
            print(f"  Agents: {', '.join(workflow['agents'])}")
            print(f"  Tasks: {', '.join(workflow['tasks'])}")
        
        print("\nAVAILABLE AGENTS:")
        print("=================")
        
        for key, agent in cls.AVAILABLE_AGENTS.items():
            print(f"\n{agent['name']} ('{key}')")
            print(f"  {agent['description']}")
        
        print("\nAVAILABLE TASKS:")
        print("===============")
        
        for key, task in cls.AVAILABLE_TASKS.items():
            print(f"\n{task['name']} ('{key}')")
            agent_name = cls.AVAILABLE_AGENTS.get(task['agent'], {}).get('name', task['agent'])
            print(f"  Agent: {agent_name}")
            print(f"  Dependencies: {', '.join(task['dependencies']) if task['dependencies'] else 'None'}")
    
    def cache_processed_data(self, data_type, data):
        """
        Cache processed data to avoid reprocessing
        
        Args:
            data_type (str): Type of data being cached
            data (Any): The data to cache
        """
        cache_key = f"{data_type}_{hash(str(self.custom_inputs))}"
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
        
        try:
            with open(cache_file, 'w') as f:
                json.dump(data, f)
            logger.info(f"Cached {data_type} data successfully")
        except Exception as e:
            logger.warning(f"Failed to cache {data_type} data: {str(e)}") 

    def _ensure_dependencies(self, selected_tasks):
        """
        Detect and fix missing dependencies in selected tasks
        
        Args:
            selected_tasks (list): List of task keys
            
        Returns:
            list: Updated list with all required dependencies
        """
        # Keep track of what we've added to avoid duplicates
        tasks_to_add = set(selected_tasks)
        dependencies_added = set()
        
        # Keep looping until we've resolved all dependencies
        while True:
            new_dependencies = set()
            
            # For each task, check its dependencies
            for task_key in tasks_to_add:
                if task_key not in self.AVAILABLE_TASKS:
                    self.logger.warning(f"Task '{task_key}' not found in available tasks")
                    continue
                    
                dependencies = self.AVAILABLE_TASKS[task_key]["dependencies"]
                
                # Add any missing dependencies
                for dep_key in dependencies:
                    if dep_key not in tasks_to_add and dep_key not in dependencies_added:
                        new_dependencies.add(dep_key)
                        self.logger.info(f"Adding missing dependency: '{dep_key}' for task '{task_key}'")
            
            # If no new dependencies were added, we're done
            if not new_dependencies:
                break
            
            # Add the new dependencies to the tasks
            tasks_to_add.update(new_dependencies)
            dependencies_added.update(new_dependencies)
        
        return list(tasks_to_add)

    def _validate_workflow(self, selected_agents, selected_tasks):
        """
        Validate that the selected agents and tasks exist and are compatible
        
        Args:
            selected_agents (list): List of agent keys
            selected_tasks (list): List of task keys
            
        Returns:
            bool: True if workflow is valid, False otherwise
        """
        errors = []
        warnings = []
        
        # Ensure at least one agent and one task are selected
        if not selected_agents:
            errors.append("No agents selected")
        
        if not selected_tasks:
            errors.append("No tasks selected")
        
        # Check that all selected tasks exist
        for task_key in selected_tasks:
            if task_key not in self.AVAILABLE_TASKS:
                errors.append(f"Task '{task_key}' not found in available tasks")
                continue
            
            # Check that the required agent for the task is selected
            task_agent = self.AVAILABLE_TASKS[task_key]["agent"]
            if task_agent not in selected_agents:
                errors.append(f"Task '{task_key}' requires agent '{task_agent}' which is not selected")
        
        # Check for dependencies
        for task_key in selected_tasks:
            if task_key not in self.AVAILABLE_TASKS:
                continue  # Already reported above
            
            dependencies = self.AVAILABLE_TASKS[task_key]["dependencies"]
            
            for dep_key in dependencies:
                if dep_key not in selected_tasks:
                    warnings.append(f"Task '{task_key}' depends on '{dep_key}' which is not selected")
        
        # Check for circular dependencies
        if self._has_circular_dependencies(selected_tasks):
            errors.append("Circular dependency detected in workflow")
        
        # Log any warnings or errors
        for warning in warnings:
            self.logger.warning(warning)
        
        for error in errors:
            self.logger.error(error)
        
        self.logger.info("Workflow validation complete")
        
        # Return True if no errors, False otherwise
        return len(errors) == 0

    def _has_circular_dependencies(self, selected_tasks):
        """
        Check if there are circular dependencies in the selected tasks
        
        Args:
            selected_tasks (list): List of task keys
            
        Returns:
            bool: True if there are circular dependencies, False otherwise
        """
        # Create a graph of dependencies
        graph = {}
        
        for task_key in selected_tasks:
            if task_key not in self.AVAILABLE_TASKS:
                continue
            
            dependencies = self.AVAILABLE_TASKS[task_key]["dependencies"]
            graph[task_key] = [dep for dep in dependencies if dep in selected_tasks]
        
        # Function to detect cycles in a directed graph
        def has_cycle(node, visited, rec_stack):
            visited[node] = True
            rec_stack[node] = True
            
            for neighbor in graph.get(node, []):
                if not visited.get(neighbor, False):
                    if has_cycle(neighbor, visited, rec_stack):
                        return True
                elif rec_stack.get(neighbor, False):
                    return True
                
            rec_stack[node] = False
            return False
        
        # Check for cycles in each connected component
        visited = {}
        rec_stack = {}
        
        for node in graph:
            if not visited.get(node, False):
                if has_cycle(node, visited, rec_stack):
                    return True
                
        return False

    def _execute_workflow(self, selected_agents, selected_tasks):
        """
        Execute the workflow with the selected agents and tasks
        
        Args:
            selected_agents (list): List of agent keys to use
            selected_tasks (list): List of task keys to execute
            
        Returns:
            dict: Results of task execution
        """
        self.logger.info(f"Executing workflow with {len(selected_agents)} agents and {len(selected_tasks)} tasks")
        
        # Create agents
        agents = self._create_agents(selected_agents)
        
        # Fix any missing dependencies in the tasks
        selected_tasks = self._ensure_dependencies(selected_tasks)
        
        # Create tasks
        tasks = self._create_tasks(selected_tasks, agents)
        
        # Get the next API key for crew (without logging it)
        current_key = get_next_api_key()
        
        # Create crew
        crew = Crew(
            agents=list(agents.values()),
            tasks=tasks,
            verbose=self.verbose,
            process=Process.sequential,
            llm=MODEL_NAME,  # Specify the LLM to use
            api_key=current_key  # Use the rotated API key (securely)
        )
        
        # Execute crew
        try:
            self.logger.info("Starting crew execution")
            print("\n" + "=" * 50)
            print("EXECUTING EDUCATIONAL WORKFLOW".center(50))
            print("=" * 50 + "\n")
            
            total_tasks = len(tasks)
            print(f"The AI crew will execute {total_tasks} tasks to complete your educational request.")
            print(f"Processing subject: {self.custom_inputs.get('subject', 'General topic')}")
            print(f"Focusing on: {self.custom_inputs.get('topic', 'Various aspects')}")
            print("\nThis may take several minutes depending on the complexity.\n")
            print("Task execution progress:")
            
            # Add API key rotation for each task
            original_execute_tasks = crew._execute_tasks
            
            def execute_tasks_with_api_rotation(tasks_list):
                results = []
                for task in tasks_list:
                    # Rotate API key for each task (securely)
                    # Don't set it directly on crew or agent, just track for logging
                    _ = get_next_api_key()
                    
                    result = original_execute_tasks([task])
                    results.extend(result)
                return results
                
            # Replace the execute_tasks method with our custom one
            crew._execute_tasks = execute_tasks_with_api_rotation
            
            result = crew.kickoff(inputs=self.custom_inputs)  # Pass custom inputs to the crew
            
            print("\n" + "=" * 50)
            print("EDUCATIONAL WORKFLOW COMPLETED".center(50))
            print("=" * 50 + "\n")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error executing crew: {str(e)}")
            print(f"\n❌ Error during execution: {str(e)}")
            print("Check the logs for more details.")
            return {"error": str(e)}

    @staticmethod
    def get_workflow_task_dependencies(workflow_key):
        """
        Get all dependencies for a given workflow's tasks, including transitive dependencies
        
        Args:
            workflow_key (str): Key of the workflow to check
            
        Returns:
            set: Set of all task dependencies
        """
        if workflow_key not in DynamicEducationCrew.RECOMMENDED_WORKFLOWS:
            return set()
        
        workflow = DynamicEducationCrew.RECOMMENDED_WORKFLOWS[workflow_key]
        workflow_tasks = workflow["tasks"]
        all_dependencies = set()
        
        for task_key in workflow_tasks:
            if task_key in DynamicEducationCrew.AVAILABLE_TASKS:
                dependencies = DynamicEducationCrew.AVAILABLE_TASKS[task_key]["dependencies"]
                all_dependencies.update(dependencies)
        
        return all_dependencies

    @staticmethod
    def validate_workflow_dependencies(workflow_key):
        """
        Check if a workflow includes all necessary dependencies for its tasks
        
        Args:
            workflow_key (str): Key of the workflow to check
            
        Returns:
            tuple: (is_valid, missing_dependencies)
        """
        if workflow_key not in DynamicEducationCrew.RECOMMENDED_WORKFLOWS:
            return False, []
        
        workflow = DynamicEducationCrew.RECOMMENDED_WORKFLOWS[workflow_key]
        workflow_tasks = workflow["tasks"]
        
        missing_dependencies = []
        
        # Find all dependencies
        all_dependencies = DynamicEducationCrew.get_workflow_task_dependencies(workflow_key)
        
        # Check if all dependencies are included in the workflow
        for dep in all_dependencies:
            if dep not in workflow_tasks:
                missing_dependencies.append(dep)
        
        return len(missing_dependencies) == 0, missing_dependencies

    @staticmethod
    def get_required_agents_for_tasks(task_keys):
        """
        Get all agents required for a set of tasks
        
        Args:
            task_keys (list): List of task keys
            
        Returns:
            set: Set of agent keys required for the tasks
        """
        required_agents = set()
        
        for task_key in task_keys:
            if task_key in DynamicEducationCrew.AVAILABLE_TASKS:
                agent_key = DynamicEducationCrew.AVAILABLE_TASKS[task_key]["agent"]
                required_agents.add(agent_key)
        
        return required_agents

    def run_with_workflow(self, workflow_key):
        """
        Execute the educational AI with a predefined workflow
        
        Args:
            workflow_key (str): Key of the workflow to use
            
        Returns:
            dict: Results of the workflow execution
        """
        self.logger.info(f"Running with workflow: {workflow_key}")
        
        # Check if workflow exists
        if workflow_key not in self.RECOMMENDED_WORKFLOWS:
            self.logger.error(f"Workflow '{workflow_key}' not found in recommended workflows")
            print(f"Error: Workflow '{workflow_key}' not found. Available workflows:")
            for key, workflow in self.RECOMMENDED_WORKFLOWS.items():
                print(f"  - {key}: {workflow['name']}")
            return {"error": f"Workflow '{workflow_key}' not found"}
        
        # Get workflow definition
        workflow = self.RECOMMENDED_WORKFLOWS[workflow_key]
        
        # Validate workflow
        is_valid, missing_dependencies = self.validate_workflow_dependencies(workflow_key)
        if not is_valid:
            self.logger.warning(f"Workflow '{workflow_key}' has missing dependencies: {missing_dependencies}")
            print(f"⚠️ Workflow '{workflow_key}' is missing some dependencies.")
            print("These will be automatically added to ensure proper functioning.")
        
        # Get workflow agents and tasks
        selected_agents = workflow["agents"].copy()
        selected_tasks = workflow["tasks"].copy()
        
        # If there are missing dependencies, add them
        if not is_valid:
            selected_tasks.extend(missing_dependencies)
            
            # Add required agents for the missing dependencies
            required_agents = self.get_required_agents_for_tasks(missing_dependencies)
            for agent_key in required_agents:
                if agent_key not in selected_agents:
                    selected_agents.append(agent_key)
                    self.logger.info(f"Adding required agent '{agent_key}' for missing dependencies")
        
        # Check if we have document content
        has_document_content = self.custom_inputs.get('has_document_content', False)
        
        # If this is a document-focused workflow, make sure we have the necessary agents and tasks
        if workflow_key in ["document_summarizer", "comprehensive_notes"]:
            if "document_analyzer" not in selected_agents:
                selected_agents.append("document_analyzer")
                self.logger.info("Added document analyzer agent to document-focused workflow")
                
            if "visual_content_analyzer" not in selected_agents:
                selected_agents.append("visual_content_analyzer")
                self.logger.info("Added visual content analyzer agent to document-focused workflow")
                
            # Check that we have the essential document tasks
            essential_doc_tasks = ["analyze_document", "create_document_summary", "generate_study_notes"]
            for task in essential_doc_tasks:
                if task not in selected_tasks:
                    selected_tasks.append(task)
                    self.logger.info(f"Added essential document task '{task}' to document-focused workflow")
                    
            # Check for additional visual and assessment tasks for comprehensive notes workflow
            if workflow_key == "comprehensive_notes":
                visual_assessment_tasks = ["create_concept_map", "generate_practice_questions"]
                for task in visual_assessment_tasks:
                    if task not in selected_tasks:
                        selected_tasks.append(task)
                        self.logger.info(f"Added task '{task}' to comprehensive notes workflow")
                
                # Make sure we have assessment designer agent for practice questions
                if "assessment_designer" not in selected_agents:
                    selected_agents.append("assessment_designer")
                    self.logger.info("Added assessment designer agent to comprehensive notes workflow")
        
        # For non-document workflows, check if we need to add document capabilities
        elif has_document_content:
            self.logger.info("Detected document content - enhancing standard workflow with document analysis capabilities")
            
            # Add document analyzer agent if not already present
            if "document_analyzer" not in selected_agents:
                selected_agents.append("document_analyzer")
                self.logger.info("Added document analyzer agent to workflow")
            
            # For visualization and concept mapping
            if any(ext in self.custom_inputs.get('additional_content', '').lower() for ext in ['.pdf', '.ppt', '.pptx']):
                if "visual_content_analyzer" not in selected_agents:
                    selected_agents.append("visual_content_analyzer")
                    self.logger.info("Added visual content analyzer agent for PDF/PPT analysis")
            
            # Add basic document analysis tasks if not already present
            basic_doc_tasks = ["analyze_document", "create_document_summary"]
            for task in basic_doc_tasks:
                if task not in selected_tasks:
                    selected_tasks.append(task)
                    self.logger.info(f"Added {task} task to workflow")
                    
            # If the workflow is focused on learning materials creation, add study notes generation
            if any(task in selected_tasks for task in ["create_study_guide", "create_learning_plan"]):
                if "generate_study_notes" not in selected_tasks:
                    selected_tasks.append("generate_study_notes")
                    self.logger.info("Added study notes generation to workflow")
                    
                if "create_concept_map" not in selected_tasks:
                    selected_tasks.append("create_concept_map")
                    self.logger.info("Added concept map creation to workflow")
        
        # Enhance workflow with multimodal capabilities if needed
        input_types = self.custom_inputs.get("input_types", {})
        if any([input_types.get("image_urls", False), 
                input_types.get("urls", False), 
                input_types.get("potential_foreign_text", False)]):
            
            # Add multimodal capabilities
            if input_types.get("image_urls", False) and "visual_content_analyzer" not in selected_agents:
                selected_agents.append("visual_content_analyzer")
                selected_tasks.append("analyze_visual_content")
                
            if input_types.get("urls", False) and "web_resource_explorer" not in selected_agents:
                selected_agents.append("web_resource_explorer")
                selected_tasks.append("explore_web_resources")
                
            if input_types.get("potential_foreign_text", False) and "language_translator" not in selected_agents:
                selected_agents.append("language_translator")
                selected_tasks.append("translate_key_content")
        
        # For any document content, ensure we have all necessary agents for the tasks
        required_agents = self.get_required_agents_for_tasks(selected_tasks)
        for agent_key in required_agents:
            if agent_key not in selected_agents:
                selected_agents.append(agent_key)
                self.logger.info(f"Added required agent '{agent_key}' for document tasks")
        
        # Execute workflow
        return self._execute_workflow(selected_agents, selected_tasks)

    def run(self):
        """
        Execute the educational AI crew with the selected workflow
        
        Returns:
            dict: Results of the execution
        """
        try:
            self.logger.info("Starting educational AI crew execution")
            
            # Get any workflow explicitly specified
            specified_workflow = self.custom_inputs.get("selected_workflow")
            
            # Check for document content in additional_content
            additional_content = self.custom_inputs.get('additional_content', '')
            has_document = False
            
            if additional_content:
                # Check for document file extensions
                if any(ext in additional_content.lower() for ext in ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.rtf', '.odt']):
                    self.logger.info("Detected document content in input")
                    self.custom_inputs['has_document_content'] = True
                    has_document = True
                    
                    # Extract document paths for later processing
                    document_paths = self._extract_document_paths(additional_content)
                    self.custom_inputs['document_paths'] = document_paths
                    self.logger.info(f"Extracted {len(document_paths)} document paths: {document_paths}")
                    
                    # If no workflow explicitly selected and document content is detected, 
                    # automatically choose a document-focused workflow
                    if not specified_workflow:
                        self.logger.info("Selecting document analysis workflow due to detected document content")
                        print("\n📄 Document detected! Using document analysis workflow...")
                        
                        # Choose the comprehensive notes workflow for a complete analysis
                        selected_workflow = "comprehensive_notes"
                        self.custom_inputs["selected_workflow"] = selected_workflow
                        print(f"\nUsing '{selected_workflow}' workflow for document analysis.")
                    else:
                        selected_workflow = specified_workflow
                else:
                    # If no document content but a subject is provided, recommend based on subject
                    subject = self.custom_inputs.get('subject', '')
                    if subject and not specified_workflow:
                        # Get recommendations based on subject
                        recommendations = self.get_workflow_recommendations(subject)
                        
                        # Choose the most appropriate workflow for this subject
                        if "programming" in subject.lower() or "coding" in subject.lower():
                            selected_workflow = "practical"  # Best for programming
                        elif any(term in subject.lower() for term in ["visual", "art", "design", "photo"]):
                            selected_workflow = "visual_learning"  # Best for visual subjects
                        elif any(term in subject.lower() for term in ["research", "science", "physics", "biology", "chemistry"]):
                            selected_workflow = "research"  # Best for scientific subjects
                        elif any(term in subject.lower() for term in ["language", "literature", "history"]):
                            selected_workflow = "multilingual"  # Best for language/humanities
                        else:
                            selected_workflow = "standard"  # Default to standard comprehensive workflow
                        
                        self.custom_inputs["selected_workflow"] = selected_workflow
                        print(f"\nRecommended workflow for '{subject}': {selected_workflow}")
                        print(f"Using '{self.RECOMMENDED_WORKFLOWS[selected_workflow]['name']}' workflow")
                    else:
                        # Use specified workflow or default to standard
                        selected_workflow = specified_workflow or "standard"
                        self.custom_inputs["selected_workflow"] = selected_workflow
            else:
                # No additional content, just use specified workflow or default
                selected_workflow = specified_workflow or "standard"
                self.custom_inputs["selected_workflow"] = selected_workflow
            
            # If workflow is custom, handle separately
            if selected_workflow == "custom":
                selected_agents = self.custom_inputs.get("selected_agents", [])
                selected_tasks = self.custom_inputs.get("selected_tasks", [])
                
                if not selected_agents or not selected_tasks:
                    self.logger.error("Custom workflow selected but no agents or tasks provided")
                    print("Error: Custom workflow requires specific agents and tasks. Using standard workflow instead.")
                    return self.run_with_workflow("standard")
                
                # Add document analysis capabilities if needed
                if has_document and "document_analyzer" not in selected_agents:
                    self.logger.info("Adding document analysis capabilities to custom workflow")
                    selected_agents.append("document_analyzer")
                    
                    # Add document analysis tasks if not already included
                    doc_tasks = ["analyze_document", "create_document_summary", "generate_study_notes"]
                    for task in doc_tasks:
                        if task not in selected_tasks:
                            selected_tasks.append(task)
                
                # Add visual content analyzer for PDFs and presentations
                if has_document and any(ext in additional_content.lower() for ext in ['.pdf', '.ppt', '.pptx']):
                    if "visual_content_analyzer" not in selected_agents:
                        selected_agents.append("visual_content_analyzer")
                    if "create_concept_map" not in selected_tasks:
                        selected_tasks.append("create_concept_map")
                
                # Add any missing dependencies
                self.logger.info("Checking custom workflow for missing dependencies")
                selected_tasks = self._ensure_dependencies(selected_tasks)
                
                # Make sure we have all required agents for the tasks
                required_agents = self.get_required_agents_for_tasks(selected_tasks)
                for agent_key in required_agents:
                    if agent_key not in selected_agents:
                        selected_agents.append(agent_key)
                        self.logger.info(f"Adding required agent '{agent_key}' for custom workflow tasks")
                
                # Validate the workflow
                if not self._validate_workflow(selected_agents, selected_tasks):
                    self.logger.error("Custom workflow validation failed")
                    print("Error: Custom workflow validation failed. Using standard workflow instead.")
                    return self.run_with_workflow("standard")
                
                # Execute the workflow
                return self._execute_workflow(selected_agents, selected_tasks)
            
            # Handle predefined workflows
            else:
                return self.run_with_workflow(selected_workflow)
            
        except Exception as e:
            self.logger.error(f"Error in run method: {str(e)}")
            print(f"Error: {str(e)}")
            return {"error": str(e)}

    def _extract_document_paths(self, content_str):
        """
        Extract document file paths from the input content string.
        
        Args:
            content_str (str): The input string that may contain document paths
            
        Returns:
            list: A list of extracted document paths
        """
        if not content_str:
            return []
            
        # List of common document extensions to search for
        doc_extensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.rtf', '.odt']
        
        # Split the content by whitespace and newlines to identify potential paths
        potential_paths = re.split(r'[\s\n,;]+', content_str)
        
        # Extract paths that end with document extensions
        document_paths = []
        for path in potential_paths:
            path = path.strip()
            # Check if the path ends with a document extension
            if any(path.lower().endswith(ext) for ext in doc_extensions):
                # For simple paths without quotes
                document_paths.append(path)
            # Check for common URL patterns containing documents
            elif any(f"{ext}" in path.lower() for ext in doc_extensions):
                # For paths where the extension might be in a URL parameter
                document_paths.append(path)
        
        self.logger.info(f"Extracted {len(document_paths)} document paths from input content")
        
        # Store paths in cache for document processing
        if document_paths:
            cache_key = f"document_paths_{time.time()}"
            cache_file = os.path.join(os.getcwd(), f".cache_{cache_key}.json")
            
            try:
                with open(cache_file, 'w') as f:
                    json.dump(document_paths, f)
                self.logger.info(f"Cached document paths to {cache_file}")
                
                # Store the cache key for later retrieval
                self.custom_inputs['document_cache_key'] = cache_key
                self.custom_inputs['document_cache_file'] = cache_file
            except Exception as e:
                self.logger.warning(f"Failed to cache document paths: {str(e)}")
                
        return document_paths

    def crew(self):
        """Creates the Dynamic Educational AI Agents crew"""
        self.logger.info("Creating Dynamic Educational AI Agents crew")
        
        if self.errors:
            self.logger.warning(f"Creating crew with {len(self.errors)} initialization warnings/errors")
        
        try:
            # Only attempt to create agents and tasks if we have valid selections
            if not self.selected_agents_keys:
                raise ValueError("No agents selected")
                
            if not self.selected_tasks_keys:
                raise ValueError("No tasks selected")
            
            # Create agents
            self.agents = self._create_agents(self.selected_agents_keys)
            
            if not self.agents:
                raise ValueError("Failed to create any agents")
            
            # Create tasks
            self.tasks = self._create_tasks(self.selected_tasks_keys, self.agents)
            
            if not self.tasks:
                raise ValueError("No tasks available to execute")
            
            # Get the next API key to use for crew (without logging it)
            current_key = get_next_api_key()
            
            # Create the crew
            crew = Crew(
                agents=list(self.agents.values()),
                tasks=self.tasks,
                verbose=self.verbose,
                process=Process.sequential,
                llm=MODEL_NAME,  # Specify the LLM to use
                api_key=current_key  # Use the rotated API key (securely)
            )
            
            # Add a function that will execute the tasks with delays in between
            original_execute_tasks = crew._execute_tasks
            
            def execute_tasks_with_delay(tasks):
                # Override the execute_tasks function to add delays between task executions
                results = []
                total_tasks = len(tasks)
                
                for i, task in enumerate(tasks):
                    # Add a delay before executing each task
                    delay_time = TASK_EXECUTION_DELAY + random.uniform(1, 3)  # Add randomness to delay
                    # Reduce delay if we have multiple API keys
                    if len(GEMINI_API_KEYS) > 1:
                        delay_time = delay_time / 2
                    
                    print(f"\nWaiting {delay_time:.2f}s before starting task {i+1}/{total_tasks}: {task.description[:50]}...")
                    time.sleep(delay_time)
                    
                    # Show progress
                    agent_name = getattr(task.agent, 'role', 'Unknown Agent')
                    print(f"\n[Task {i+1}/{total_tasks}] Executing with {agent_name}...")
                    
                    # Get a new API key but don't try to set it directly
                    # The API key passed to the crew creation is sufficient
                    # We'll just wait longer between tasks to avoid rate limits
                    _ = get_next_api_key()  # Still rotate the key counter for logging purposes
                    
                    result = original_execute_tasks([task])
                    
                    # Add delay after task execution
                    print(f"\nTask {i+1}/{total_tasks} completed. Cooling down...")
                    delay_time = MAX_DELAY + random.uniform(1, 3)
                    # Reduce cooldown if we have multiple API keys
                    if len(GEMINI_API_KEYS) > 1:
                        delay_time = delay_time / 2
                    
                    time.sleep(delay_time)
                    
                    results.extend(result)
                    
                    # Show completion status
                    print(f"Completed {i+1}/{total_tasks} tasks ({(i+1)/total_tasks*100:.0f}%)")
                    
                return results
                
            # Replace the execute_tasks method with our custom one
            crew._execute_tasks = execute_tasks_with_delay
            
            self.logger.info("Crew created successfully with API key rotation")
            return crew
            
        except Exception as e:
            self.logger.error(f"Error creating crew: {str(e)}")
            self.errors.append({
                "stage": "crew_creation",
                "error": str(e)
            })
            raise ValueError(f"Cannot create crew: {str(e)}")