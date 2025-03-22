#!/usr/bin/env python
import sys
import warnings
import os
import time
import random
from dotenv import load_dotenv
import argparse
import re
import logging
from tqdm import tqdm
import threading

from latest_ai_development.dynamic_crew import DynamicEducationCrew

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "dynamic_crew.log"))
    ]
)
logger = logging.getLogger('DynamicMain')

# Load environment variables
load_dotenv()

# Get the model from environment variables
MODEL_NAME = os.getenv("MODEL", "gemini/gemini-1.5-flash")

# Rate limiting prevention configuration
MIN_DELAY = 2  # Minimum delay between API calls in seconds
MAX_DELAY = 5  # Maximum delay for randomized waits

# Progress indicator
progress_active = False
progress_thread = None

def start_progress(message="Processing"):
    """Start a progress indicator"""
    global progress_active, progress_thread
    progress_active = True
    
    def show_progress():
        spinner = ['|', '/', '-', '\\']
        i = 0
        while progress_active:
            print(f"\r{message} {spinner[i % len(spinner)]}", end="", flush=True)
            i += 1
            time.sleep(0.2)
        print("\r" + " " * (len(message) + 2), end="\r", flush=True)
    
    progress_thread = threading.Thread(target=show_progress)
    progress_thread.daemon = True
    progress_thread.start()

def stop_progress():
    """Stop the progress indicator"""
    global progress_active
    progress_active = False
    if progress_thread and progress_thread.is_alive():
        progress_thread.join(1)

def add_delay(reason="API call"):
    """Add a randomized delay to prevent rate limiting"""
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    logger.info(f"Adding {delay:.2f}s delay for {reason}")
    
    start_progress(f"Waiting {delay:.2f}s for {reason}")
    time.sleep(delay)
    stop_progress()

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

def get_user_input(prompt, options=None, default=None):
    """Get input from the user with validation against options if provided"""
    if options:
        option_str = "/".join(options)
        prompt = f"{prompt} ({option_str}) [{default}]: " if default else f"{prompt} ({option_str}): "
    else:
        prompt = f"{prompt} [{default}]: " if default else f"{prompt}: "
    
    while True:
        user_input = input(prompt).strip()
        
        if not user_input and default:
            return default
        
        if not options or user_input in options:
            return user_input
        
        print(f"Invalid input. Please choose from: {', '.join(options)}")

def get_multiple_choices(prompt, options, min_selections=1, max_selections=None):
    """Get multiple selections from the user"""
    print(f"\n{prompt}")
    print("Available options:")
    
    for i, option in enumerate(options, 1):
        print(f"  {i}. {option}")
    
    print("\nEnter the numbers corresponding to your choices, separated by commas.")
    print(f"You must select at least {min_selections} option(s).")
    if max_selections:
        print(f"You can select at most {max_selections} option(s).")
    
    while True:
        selection_input = input("Your selections: ").strip()
        
        try:
            # Handle empty input
            if not selection_input:
                print(f"Please select at least {min_selections} option(s).")
                continue
                
            # Split by commas and convert to integers
            selections = [int(s.strip()) for s in selection_input.split(",")]
            
            # Validate selections
            if any(s < 1 or s > len(options) for s in selections):
                print(f"Invalid selection. Please choose numbers between 1 and {len(options)}.")
                continue
                
            # Check for duplicates
            if len(selections) != len(set(selections)):
                print("Please avoid duplicate selections.")
                continue
                
            # Check min/max constraints
            if len(selections) < min_selections:
                print(f"Please select at least {min_selections} option(s).")
                continue
                
            if max_selections and len(selections) > max_selections:
                print(f"Please select at most {max_selections} option(s).")
                continue
                
            # Convert selections to the actual options
            selected_options = [options[i-1] for i in selections]
            return selected_options
            
        except ValueError:
            print("Invalid input. Please enter comma-separated numbers only.")

def get_subject_specific_examples(subject):
    """
    Returns subject-specific examples for topics and learning styles
    """
    subject_lower = subject.lower()
    
    # Default examples
    examples = {
        "topic": "Core Concepts",
        "learning_style": "Visual and hands-on learning"
    }
    
    # Programming/Computer Science examples
    if any(term in subject_lower for term in ["programming", "coding", "development", "computer science", "software"]):
        if "python" in subject_lower:
            examples["topic"] = "Data Structures and Algorithms"
        elif "java" in subject_lower:
            examples["topic"] = "Object-Oriented Programming"
        elif "javascript" in subject_lower or "web" in subject_lower:
            examples["topic"] = "DOM Manipulation and Event Handling"
        elif "machine learning" in subject_lower or "ai" in subject_lower:
            examples["topic"] = "Neural Networks and Deep Learning"
        else:
            examples["topic"] = "Data Structures and Algorithms"
        examples["learning_style"] = "Hands-on coding with practical examples"
    
    # Mathematics examples
    elif any(term in subject_lower for term in ["math", "mathematics", "calculus", "algebra", "geometry"]):
        if "calculus" in subject_lower:
            examples["topic"] = "Limits and Derivatives"
        elif "algebra" in subject_lower:
            examples["topic"] = "Polynomial Functions and Equations"
        elif "geometry" in subject_lower:
            examples["topic"] = "Euclidean Geometry and Transformations"
        elif "statistics" in subject_lower:
            examples["topic"] = "Probability Distributions and Hypothesis Testing"
        else:
            examples["topic"] = "Core Mathematical Concepts"
        examples["learning_style"] = "Visual representations with step-by-step problem solving"
    
    # Science examples
    elif any(term in subject_lower for term in ["physics", "chemistry", "biology", "science"]):
        if "physics" in subject_lower:
            examples["topic"] = "Classical Mechanics and Newton's Laws"
        elif "chemistry" in subject_lower:
            examples["topic"] = "Chemical Bonding and Molecular Structure"
        elif "biology" in subject_lower:
            examples["topic"] = "Cell Structure and Function"
        else:
            examples["topic"] = "Scientific Method and Research Principles"
        examples["learning_style"] = "Experimental learning with theoretical foundations"
    
    # History examples
    elif any(term in subject_lower for term in ["history", "archaeology", "civilization", "culture"]):
        if "world" in subject_lower:
            examples["topic"] = "Industrial Revolution and Global Impact"
        elif "ancient" in subject_lower:
            examples["topic"] = "Ancient Civilizations and Their Legacies"
        elif "modern" in subject_lower:
            examples["topic"] = "Post-World War II Global Order"
        elif "art" in subject_lower:
            examples["topic"] = "Renaissance Art and Cultural Significance"
        else:
            examples["topic"] = "Key Historical Events and Their Significance"
        examples["learning_style"] = "Narrative-based learning with primary sources"
    
    # Arts and humanities
    elif any(term in subject_lower for term in ["art", "music", "literature", "philosophy", "language"]):
        if "music" in subject_lower:
            examples["topic"] = "Music Theory and Composition"
        elif "literature" in subject_lower:
            examples["topic"] = "Literary Analysis and Critical Theory"
        elif "philosophy" in subject_lower:
            examples["topic"] = "Ethical Frameworks and Moral Philosophy"
        elif "language" in subject_lower:
            examples["topic"] = "Grammar Structure and Syntax"
        else:
            examples["topic"] = "Creative Principles and Analysis"
        examples["learning_style"] = "Exploratory learning with analytical reflection"
    
    # Business/Economics
    elif any(term in subject_lower for term in ["business", "economics", "finance", "management", "marketing"]):
        if "finance" in subject_lower:
            examples["topic"] = "Investment Analysis and Portfolio Management"
        elif "marketing" in subject_lower:
            examples["topic"] = "Market Research and Consumer Behavior"
        elif "management" in subject_lower:
            examples["topic"] = "Organizational Behavior and Leadership"
        elif "economics" in subject_lower:
            examples["topic"] = "Microeconomic Principles and Market Structures"
        else:
            examples["topic"] = "Business Strategy and Competitive Analysis"
        examples["learning_style"] = "Case-study approach with real-world applications"
    
    # Astronomy and Space
    elif any(term in subject_lower for term in ["astronomy", "space", "cosmology", "planet", "star"]):
        if "planet" in subject_lower:
            examples["topic"] = "Planetary Formation and Characteristics"
        elif "star" in subject_lower:
            examples["topic"] = "Stellar Evolution and Life Cycles"
        elif "cosmology" in subject_lower:
            examples["topic"] = "Big Bang Theory and Universe Expansion"
        else:
            examples["topic"] = "Celestial Bodies and Cosmic Phenomena"
        examples["learning_style"] = "Visual learning with observational techniques"
    
    return examples

def detect_input_type(input_text):
    """
    Detect the type of input provided and categorize it appropriately.
    Returns a dictionary with identified input types and their content.
    """
    input_types = {
        "text": input_text,
        "urls": [],
        "image_urls": [],
        "potential_foreign_text": False,
        "code_snippets": []
    }
    
    # Detect URLs
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, input_text)
    
    for url in urls:
        # Simple check for common image extensions
        if any(url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
            input_types["image_urls"].append(url)
        else:
            input_types["urls"].append(url)
    
    # Remove URLs from text for separate processing
    clean_text = re.sub(url_pattern, '', input_text).strip()
    input_types["text"] = clean_text
    
    # Simple heuristic to detect potential non-English/foreign text
    # Check if text contains a high percentage of non-ASCII characters
    if clean_text and len(clean_text) > 10:
        non_ascii_count = sum(1 for char in clean_text if ord(char) > 127)
        if non_ascii_count / len(clean_text) > 0.3:  # If more than 30% non-ASCII
            input_types["potential_foreign_text"] = True
    
    # Detect code snippets (simple heuristic)
    code_patterns = [
        r'```[\s\S]*?```',  # Markdown code blocks
        r'<code>[\s\S]*?</code>'  # HTML code tags
    ]
    
    for pattern in code_patterns:
        code_matches = re.findall(pattern, input_text)
        input_types["code_snippets"].extend(code_matches)
    
    return input_types

def enhance_workflow_with_multimodal(workflow_config, input_types):
    """
    Dynamically enhance a workflow by adding multimodal agents and tasks 
    based on the detected input types.
    """
    original_agents = workflow_config["agents"].copy()
    original_tasks = workflow_config["tasks"].copy()
    
    # Track which multimodal agents and tasks we've added
    added_agents = set()
    added_tasks = []
    
    # Add visual content analyzer if image URLs are present
    if input_types["image_urls"] and "visual_content_analyzer" not in original_agents:
        original_agents.append("visual_content_analyzer")
        added_agents.add("visual_content_analyzer")
        added_tasks.append("analyze_visual_content")
    
    # Add web resource explorer if regular URLs are present
    if input_types["urls"] and "web_resource_explorer" not in original_agents:
        original_agents.append("web_resource_explorer")
        added_agents.add("web_resource_explorer")
        added_tasks.append("explore_web_resources")
    
    # Add language translator if potential foreign text is detected
    if input_types["potential_foreign_text"] and "language_translator" not in original_agents:
        original_agents.append("language_translator")
        added_agents.add("language_translator")
        added_tasks.append("translate_key_content")
    
    # Add multimedia integration specialist if we have multiple media types
    if len(added_agents) > 1 and "multimedia_integration_specialist" not in original_agents:
        original_agents.append("multimedia_integration_specialist")
        added_agents.add("multimedia_integration_specialist")
        added_tasks.append("design_multimedia_learning_experience")
    
    # Ensure we have the research assistant for context (if needed)
    if (added_tasks and "research_topic" not in original_tasks and 
        "research_assistant" not in original_agents):
        original_agents.append("research_assistant")
        # Add research_topic at the beginning to ensure proper dependencies
        original_tasks.insert(0, "research_topic")
    
    # Append all new tasks to the end of the task list
    for task in added_tasks:
        if task not in original_tasks:
            original_tasks.append(task)
    
    return {
        "agents": original_agents,
        "tasks": original_tasks,
        "added_multimodal_agents": list(added_agents),
        "added_multimodal_tasks": added_tasks
    }

def validate_custom_workflow(selected_tasks):
    """
    Validate custom workflow by checking for missing dependencies and suggesting fixes
    
    Args:
        selected_tasks (list): List of selected task keys
        
    Returns:
        tuple: (is_valid, missing_dependencies, suggested_additions)
    """
    is_valid = True
    missing_dependencies = []
    suggested_additions = set()
    
    # Check for missing dependencies
    for task_key in selected_tasks:
        if task_key in DynamicEducationCrew.AVAILABLE_TASKS:
            dependencies = DynamicEducationCrew.AVAILABLE_TASKS[task_key]["dependencies"]
            for dep_key in dependencies:
                if dep_key not in selected_tasks:
                    missing_dependencies.append((task_key, dep_key))
                    suggested_additions.add(dep_key)
                    is_valid = False
    
    return is_valid, missing_dependencies, list(suggested_additions)

def interactive_workflow_setup():
    """Interactive setup to get user preferences for the workflow"""
    print("\n" + "="*80)
    print("DYNAMIC EDUCATIONAL AI CREW - INTERACTIVE SETUP".center(80))
    print("="*80 + "\n")
    
    print("Welcome to the Dynamic Educational AI Crew setup!")
    print("This wizard will help you customize your educational AI workflow.\n")
    
    # Get subject
    subject = input("Enter the subject (e.g., 'Python Programming', 'Mathematics', 'History'): ").strip()
    
    # Get subject-specific examples
    examples = get_subject_specific_examples(subject)
    
    # Get topic with subject-specific example
    topic = input(f"Enter a specific topic within {subject} (e.g., '{examples['topic']}'): ").strip()
    
    # Get learning style with subject-specific example
    learning_style = input(f"Enter the preferred learning style (e.g., '{examples['learning_style']}'): ").strip()
    
    # Get additional content (multimodal)
    print("\nYou can enhance your learning experience with additional content:")
    print("- Image URLs (for visual analysis)")
    print("- Web page URLs (for content extraction)")
    print("- Text in other languages (for translation)")
    
    additional_content = input("Enter any image URLs, web links, or content for analysis (optional): ").strip()
    
    inputs = {
        'subject': subject,
        'topic': topic,
        'learning_style': learning_style,
        'additional_content': additional_content
    }
    
    # Detect input types
    input_types = detect_input_type(additional_content)
    
    # Get workflow recommendations
    print("\nAnalyzing your input to provide recommendations...")
    add_delay("generating recommendations")
    
    recommendations = DynamicEducationCrew.get_workflow_recommendations(subject)
    
    # Select a default recommended workflow - first key from recommendations if available
    recommended_workflow = next(iter(recommendations.keys())) if recommendations else "standard"
    
    # If programming subject, prefer practical or multimedia workflow if available
    if any(term in subject.lower() for term in ["programming", "coding", "development"]):
        if "practical" in recommendations:
            recommended_workflow = "practical"
        elif "multimedia" in recommendations:
            recommended_workflow = "multimedia"
    
    print(f"\nBased on your subject '{subject}', we recommend the "
          f"'{DynamicEducationCrew.RECOMMENDED_WORKFLOWS[recommended_workflow]['name']}' workflow.")
    print(f"Description: {DynamicEducationCrew.RECOMMENDED_WORKFLOWS[recommended_workflow]['description']}")
    print(f"Reason: {recommendations.get(recommended_workflow, {}).get('explanation', 'Well-suited for your subject.')}")
    
    # Inform about multimodal enhancements if detected in input
    if any([input_types["image_urls"], input_types["urls"], input_types["potential_foreign_text"]]):
        print("\nMultimodal content detected! Your workflow will be enhanced with:")
        if input_types["image_urls"]:
            print("- Visual content analysis for images")
        if input_types["urls"]:
            print("- Web resource exploration for URLs")
        if input_types["potential_foreign_text"]:
            print("- Language translation for non-English text")
    
    # Show workflow options
    print("\nAvailable workflows:")
    for i, (key, workflow) in enumerate(DynamicEducationCrew.RECOMMENDED_WORKFLOWS.items(), 1):
        print(f"  {i}. {workflow['name']} ({key})")
        print(f"     {workflow['description']}")
    
    # Ask user to select a workflow
    workflow_options = list(DynamicEducationCrew.RECOMMENDED_WORKFLOWS.keys())
    
    workflow_choice = get_user_input("Select a workflow (number)", 
                                     options=[str(i) for i in range(1, len(workflow_options) + 1)], 
                                     default=str(workflow_options.index(recommended_workflow) + 1))
    
    selected_workflow = workflow_options[int(workflow_choice) - 1]
    
    # If custom workflow, ask for agent and task selection
    selected_agents = []
    selected_tasks = []
    
    if selected_workflow == "custom":
        print("\nYou've chosen to create a custom workflow.")
        print("The system will guide you through selecting agents and tasks, and will help ensure your workflow is valid.")
        
        # Select agents
        agent_options = list(DynamicEducationCrew.AVAILABLE_AGENTS.keys())
        agent_names = [f"{DynamicEducationCrew.AVAILABLE_AGENTS[a]['name']} ({a})" for a in agent_options]
        
        selected_agent_names = get_multiple_choices("Select the agents you want to use:", agent_names, min_selections=1)
        selected_agents = [agent_options[agent_names.index(name)] for name in selected_agent_names]
        
        # Show tasks that can be used with the selected agents
        valid_tasks = []
        valid_task_names = []
        
        for task_key, task_data in DynamicEducationCrew.AVAILABLE_TASKS.items():
            if task_data["agent"] in selected_agents:
                valid_tasks.append(task_key)
                valid_task_names.append(f"{task_data['name']} ({task_key}) - Agent: {DynamicEducationCrew.AVAILABLE_AGENTS[task_data['agent']]['name']}")
        
        if not valid_tasks:
            print("Error: No tasks are compatible with your selected agents.")
            print("Please try again with different agents.")
            return interactive_workflow_setup()
        
        # Select tasks
        print("\nSelect tasks for your workflow. The system will display dependency information to help you make valid choices.")
        
        # For each task, show its dependencies
        print("\nTask dependency information:")
        for i, task_key in enumerate(valid_tasks):
            task_data = DynamicEducationCrew.AVAILABLE_TASKS[task_key]
            deps = task_data["dependencies"]
            if deps:
                print(f"  {i+1}. {task_data['name']} depends on: {', '.join(deps)}")
        
        # Select tasks
        selected_task_names = get_multiple_choices("Select the tasks you want to execute:", valid_task_names, min_selections=1)
        selected_tasks = [valid_tasks[valid_task_names.index(name)] for name in selected_task_names]
        
        # Validate the selected tasks for dependencies
        is_valid, missing_deps, suggested_additions = validate_custom_workflow(selected_tasks)
        
        if not is_valid:
            print("\n⚠️ Warning: Your selected tasks have missing dependencies:")
            for task, dep in missing_deps:
                task_name = DynamicEducationCrew.AVAILABLE_TASKS[task]["name"]
                dep_name = DynamicEducationCrew.AVAILABLE_TASKS[dep]["name"]
                print(f"  - '{task_name}' requires '{dep_name}'")
            
            # Suggest auto-fixing
            print("\nThe system can automatically add the necessary dependencies.")
            add_deps = get_user_input("Would you like to add these missing dependencies? (y/n)", 
                                      options=["y", "n"], 
                                      default="y")
            
            if add_deps.lower() == "y":
                for dep in suggested_additions:
                    selected_tasks.append(dep)
                    # Also add the agent if needed
                    agent_key = DynamicEducationCrew.AVAILABLE_TASKS[dep]["agent"]
                    if agent_key not in selected_agents:
                        selected_agents.append(agent_key)
                
                print("Dependencies added successfully.")
            else:
                print("\n⚠️ Warning: Without adding dependencies, the workflow might not function correctly.")
                print("The system will try to fix this automatically when running, but results may vary.")
    else:
        # For predefined workflows, enhance them with multimodal capabilities if needed
        base_workflow = DynamicEducationCrew.RECOMMENDED_WORKFLOWS[selected_workflow]
        enhanced_workflow = enhance_workflow_with_multimodal(base_workflow, input_types)
        
        selected_agents = enhanced_workflow["agents"]
        selected_tasks = enhanced_workflow["tasks"]
        
        # Inform user about the enhancements if any were made
        if enhanced_workflow["added_multimodal_agents"]:
            print("\nYour workflow has been enhanced with these multimodal capabilities:")
            for agent in enhanced_workflow["added_multimodal_agents"]:
                agent_info = DynamicEducationCrew.AVAILABLE_AGENTS[agent]
                print(f"- {agent_info['name']}: {agent_info['description']}")
    
    inputs["input_types"] = input_types
    
    print("\n✅ Workflow setup complete! Running with:")
    print(f"  - Workflow: {DynamicEducationCrew.RECOMMENDED_WORKFLOWS[selected_workflow]['name']}")
    print(f"  - Agents: {len(selected_agents)}")
    print(f"  - Tasks: {len(selected_tasks)}")
    print("The system will automatically ensure all dependencies are met.")
    
    return {
        "selected_workflow": selected_workflow,
        "selected_agents": selected_agents,
        "selected_tasks": selected_tasks,
        "inputs": inputs
    }

def run(args=None):
    """
    Run the dynamic educational AI agents crew.
    """
    # If no args provided, run interactive setup
    if not args:
        args = interactive_workflow_setup()
        if not args:
            logger.error("Setup failed. Exiting.")
            return
    
    selected_workflow = args.get("selected_workflow", "standard")
    selected_agents = args.get("selected_agents", [])
    selected_tasks = args.get("selected_tasks", [])
    inputs = args.get("inputs", {
        'subject': 'Python Programming',
        'topic': 'Basic Data Structures',
        'learning_style': 'Hands-on, practical learning'
    })
    
    # Process multimodal inputs if present but not already processed
    if "additional_content" in inputs and "input_types" not in inputs:
        logger.info("Processing additional content for multimodal analysis")
        start_progress("Analyzing additional content")
        input_types = detect_input_type(inputs.get("additional_content", ""))
        inputs["input_types"] = input_types
        stop_progress()
        
        # Enhance workflow with multimodal capabilities if needed
        if not selected_agents or not selected_tasks:  # Only if not already custom selected
            logger.info("Enhancing workflow with multimodal capabilities")
            start_progress("Enhancing workflow")
            base_workflow = DynamicEducationCrew.RECOMMENDED_WORKFLOWS[selected_workflow]
            enhanced_workflow = enhance_workflow_with_multimodal(base_workflow, input_types)
            selected_agents = enhanced_workflow["agents"]
            selected_tasks = enhanced_workflow["tasks"]
            stop_progress()
    
    try:
        print("\n" + "="*80)
        print("DYNAMIC EDUCATIONAL AI CREW - EXECUTION".center(80))
        print("="*80 + "\n")
        
        print(f"Subject: {inputs['subject']}")
        print(f"Topic: {inputs['topic']}")
        print(f"Learning Style: {inputs['learning_style']}")
        
        # Print multimodal input information if available
        if "input_types" in inputs:
            if inputs["input_types"]["image_urls"]:
                print(f"Images for analysis: {len(inputs['input_types']['image_urls'])}")
            if inputs["input_types"]["urls"]:
                print(f"Web resources: {len(inputs['input_types']['urls'])}")
            if inputs["input_types"]["potential_foreign_text"]:
                print("Content includes potential non-English text (will be translated)")
        
        print(f"Workflow: {DynamicEducationCrew.RECOMMENDED_WORKFLOWS[selected_workflow]['name']}")
        
        if selected_workflow == "custom" or "input_types" in inputs:
            print("Active agents:", ", ".join(selected_agents))
            print("Tasks to execute:", ", ".join(selected_tasks))
        
        print("="*80 + "\n")
        
        # Add a delay before starting
        logger.info("Preparing to initialize dynamic Educational AI Agents")
        add_delay("initialization preparation")
        
        logger.info("Initializing dynamic Educational AI Agents")
        start_progress("Initializing dynamic Educational AI Agents")
        education_crew = DynamicEducationCrew(
            selected_workflow=selected_workflow,
            selected_agents=selected_agents,
            selected_tasks=selected_tasks,
            custom_inputs=inputs
        )
        stop_progress()
        
        # Check for initialization errors
        if education_crew.errors:
            logger.warning(f"Encountered {len(education_crew.errors)} issues during initialization:")
            for i, error in enumerate(education_crew.errors, 1):
                logger.warning(f"  {i}. [{error['phase']}]: {error['error']}")
        
        # Add a delay after initialization
        add_delay("post-initialization")
        
        logger.info("Creating crew instance")
        start_progress("Creating crew instance")
        crew = education_crew.crew()
        stop_progress()
        
        # Add a delay before kickoff
        add_delay("pre-kickoff preparation")
        
        logger.info(f"Starting dynamic crew execution with {MODEL_NAME}")
        print("Starting dynamic crew execution with Gemini model")
        print("Using model:", MODEL_NAME)
        print("Rate limiting prevention enabled with delays between {}-{}s".format(MIN_DELAY, MAX_DELAY))
        print("="*80 + "\n")
        
        # Track task progress
        task_count = len(education_crew.tasks)
        print(f"Executing {task_count} tasks:")
        for i, task in enumerate(education_crew.tasks, 1):
            agent_role = task.agent.role
            print(f"  {i}. {agent_role}: {task.description[:100]}...")
        print("\n")
        
        result = crew.kickoff(inputs=inputs)
        
        print("\n" + "="*80)
        print("EXECUTION COMPLETED".center(80))
        
        # Check for execution errors
        if education_crew.errors:
            print("\nWarning: Some issues were encountered during execution:")
            for i, error in enumerate(education_crew.errors, 1):
                if error['phase'] == 'task_execution':
                    print(f"  {i}. Task execution issue: {error['error']}")
        
        # Determine output files
        output_files = []
        for task_key in (selected_tasks if selected_workflow == "custom" or "input_types" in inputs 
                        else DynamicEducationCrew.RECOMMENDED_WORKFLOWS[selected_workflow]["tasks"]):
            if task_key in DynamicEducationCrew.AVAILABLE_TASKS and DynamicEducationCrew.AVAILABLE_TASKS[task_key].get("output_file"):
                output_files.append(DynamicEducationCrew.AVAILABLE_TASKS[task_key]["output_file"])
        
        if output_files:
            print("Output saved to the following files:")
            for file in output_files:
                print(f"- {file}")
            
            # Check if files exist
            missing_files = [f for f in output_files if not os.path.exists(f)]
            if missing_files:
                logger.warning(f"Some expected output files were not created: {', '.join(missing_files)}")
                print("\nNote: Some expected output files were not found. Check the log for details.")
        
        print("="*80)
        
        return result
    except Exception as e:
        logger.exception(f"Error during execution: {str(e)}")
        print("\n" + "="*80)
        print("ERROR OCCURRED".center(80))
        print(f"Error details: {str(e)}")
        print("See the log file for more details.")
        print("="*80)
        raise Exception(f"An error occurred while running the crew: {str(e)}")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Run the Dynamic Educational AI Crew with Multimodal Capabilities",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Workflow Types:
  basic                    A simple workflow with learning plan and study guide
  standard                 A balanced workflow with planning, resources, and study materials
  practical                Focuses on hands-on learning with practical exercises
  comprehensive            A complete educational experience with all aspects covered
  informational            Provides detailed information rather than a learning plan

Multimodal Features (Automatically Activated):
  - Visual Analysis:       Automatically analyzes images when image URLs are provided
  - Web Content:           Extracts content from web pages when URLs are provided
  - Translation:           Translates content in other languages when detected
  - Rich Outputs:          Produces educational materials with visual elements
  
Examples:
  Run interactively:
    python run_dynamic_crew.py --interactive
    
  Analyze images:
    python run_dynamic_crew.py --subject "Photography" --topic "Composition" --additional-content "https://example.com/image.jpg"
    
  Translate foreign text:
    python run_dynamic_crew.py --subject "Languages" --topic "French" --additional-content "Voici un exemple de texte français"
    
  Analyze web content:
    python run_dynamic_crew.py --subject "Web Design" --topic "UX" --additional-content "https://example.com/article"
        """
    )
    
    parser.add_argument("--workflow", choices=list(DynamicEducationCrew.RECOMMENDED_WORKFLOWS.keys()),
                        default="standard", help="The workflow to use")
    
    parser.add_argument("--subject", default="Python Programming",
                        help="The subject to create learning materials for")
    
    parser.add_argument("--topic", default="Basic Data Structures",
                        help="The specific topic within the subject")
    
    parser.add_argument("--learning-style", default="Hands-on, practical learning",
                        help="The preferred learning style")
    
    parser.add_argument("--additional-content", default="",
                        help="Additional content to analyze (images, URLs, text in other languages)")
    
    parser.add_argument("--interactive", action="store_true",
                        help="Run in interactive mode to select agents and tasks")
    
    args = parser.parse_args()
    
    if args.interactive:
        return None  # Will trigger interactive setup
    
    # Process additional content if provided
    input_types = {}
    if args.additional_content:
        input_types = detect_input_type(args.additional_content)
    
    # Start with default workflow
    selected_workflow = args.workflow
    selected_agents = []
    selected_tasks = []
    
    # If additional content provided, enhance the workflow
    if args.additional_content:
        base_workflow = DynamicEducationCrew.RECOMMENDED_WORKFLOWS[selected_workflow]
        enhanced_workflow = enhance_workflow_with_multimodal(base_workflow, input_types)
        selected_agents = enhanced_workflow["agents"]
        selected_tasks = enhanced_workflow["tasks"]
    
    return {
        "selected_workflow": selected_workflow,
        "selected_agents": selected_agents,
        "selected_tasks": selected_tasks,
        "inputs": {
            "subject": args.subject,
            "topic": args.topic,
            "learning_style": args.learning_style,
            "additional_content": args.additional_content,
            "input_types": input_types if args.additional_content else {}
        }
    }

if __name__ == "__main__":
    args = parse_arguments()
    run(args) 