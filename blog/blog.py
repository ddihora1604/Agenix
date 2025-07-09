from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.schema import AIMessage
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
import os
from datetime import datetime
import json
import rich
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.markdown import Markdown
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

console = Console()

# Pydantic models for structured output
class BlogSection(BaseModel):
    heading: str = Field(description="Section heading")
    content: str = Field(description="Section content")

class BlogPost(BaseModel):
    title: str = Field(description="Blog post title")
    meta_description: str = Field(description="Meta description for SEO")
    sections: List[BlogSection] = Field(description="Blog sections")

# Blog generator class
class BlogGenerator:
    def __init__(self, api_key: str):
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model_name="gemma2-9b-it"  # ✅ Use a valid model
        )
        self.setup_prompts()

    def setup_prompts(self):
        """Define prompt templates"""
        self.outline_template = PromptTemplate.from_template(
            "Create a {num_sections}-point structured outline for a {style} blog post about '{topic}'.\n"
            "Each point should be a clear, engaging heading."
        )
        
        self.section_template = PromptTemplate.from_template(
            "Write a {tone}, {style} paragraph about '{section}' for a blog post on '{topic}'.\n"
            "Make it engaging, informative, and well-structured."
        )

        self.title_meta_template = PromptTemplate.from_template(
            "Generate a catchy SEO-friendly title and a short meta description (max 155 characters) "
            "for a blog post about '{topic}' in a {style} style."
        )

    async def generate_blog(self, topic: str, style: str = "technical", 
                          tone: str = "informative", length: str = "medium") -> dict:
        """Generate a full blog post"""
        num_sections = {"short": 3, "medium": 5, "long": 7}[length]

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            # Generate blog outline
            progress.add_task(description="Generating blog outline...", total=None)
            outline_response = await (self.outline_template | self.llm).ainvoke({
                "topic": topic, 
                "num_sections": num_sections,
                "style": style
            })

            # ✅ Fix: Extract content correctly
            outline_text = outline_response.content.strip()
            outline = [line.strip("1234567890. ") for line in outline_text.split("\n") if line.strip()]

            # Generate sections
            sections = []
            for heading in outline:
                progress.add_task(description=f"Writing section: {heading}...", total=None)
                section_response = await (self.section_template | self.llm).ainvoke({
                    "topic": topic, 
                    "section": heading,
                    "tone": tone,
                    "style": style
                })

                # ✅ Fix: Extract content correctly
                section_text = section_response.content.strip()
                sections.append(BlogSection(heading=heading, content=section_text))

            # Generate title and meta description
            progress.add_task(description="Finalizing blog post...", total=None)
            title_meta_response = await (self.title_meta_template | self.llm).ainvoke({
                "topic": topic,
                "style": style
            })

            # ✅ Fix: Extract content correctly
            title_meta_text = title_meta_response.content.strip().split("\n")
            title = title_meta_text[0] if title_meta_text else "Untitled Blog"
            meta_description = title_meta_text[1] if len(title_meta_text) > 1 else "No description available."

            blog_post = BlogPost(
                title=title,
                meta_description=meta_description,
                sections=sections
            )

            return blog_post.dict()

    def save_and_display(self, blog_post: dict, output_dir: str = "generated_blogs"):
        """Save blog to a file and display in console"""
        os.makedirs(output_dir, exist_ok=True)
        filename = f"{blog_post['title'][:50].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(blog_post, f, indent=2)

        # Display blog in console
        console.print("\n[bold green]=== Generated Blog Post ===\n")
        console.print(Panel(
            f"[bold blue]{blog_post['title']}[/]\n\n"
            f"[italic]{blog_post['meta_description']}",
            title="Blog Overview"
        ))

        for section in blog_post['sections']:
            console.print(Panel(
                f"[bold]{section['heading']}[/]\n\n"
                f"{section['content']}",
                title="Section"
            ))

        console.print(f"\n[green]Blog saved to:[/] {filepath}\n")

# Main function
async def main():
    console.print("[bold blue]=== AI Blog Generator ===\n")

    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        console.print("[red]Error: Please set GROQ_API_KEY environment variable[/]")
        return

    # Default blog settings
    DEFAULT_STYLE = "technical"
    DEFAULT_TONE = "informative"
    DEFAULT_LENGTH = "medium"

    generator = BlogGenerator(api_key)

    while True:
        try:
            # Get blog topic
            topic = console.input("\n[bold green]Enter blog topic[/] (or 'quit' to exit): ").strip()

            if topic.lower() == 'quit':
                break

            if not topic:
                console.print("[red]Topic cannot be empty. Please try again.[/]")
                continue

            # Generate blog
            console.print("\n[bold]🔄 Generating your blog post... Please wait...[/]\n")
            blog_post = await generator.generate_blog(
                topic=topic,
                style=DEFAULT_STYLE,
                tone=DEFAULT_TONE,
                length=DEFAULT_LENGTH
            )

            # Save and display the blog
            generator.save_and_display(blog_post)

        except Exception as e:
            console.print(f"\n[red]Error: {str(e)}[/]")

        # Ask user if they want another blog
        if console.input("\nGenerate another blog? (y/n): ").lower() != 'y':
            break

    console.print("\n[bold green]Thank you for using AI Blog Generator![/]")

# Run the script
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
