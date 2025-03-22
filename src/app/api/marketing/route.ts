import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This route will handle the execution of marketing agents
export async function POST(req: NextRequest) {
  try {
    const { agentIds, userInputs } = await req.json();
    
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid agentIds' }, 
        { status: 400 }
      );
    }

    console.log(`Marketing API received request for agentIds:`, agentIds);

    // Process the workflow and check for markdown files
    const results = await processMarkdownFiles(agentIds);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error processing marketing agents:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message }, 
      { status: 500 }
    );
  }
}

async function processMarkdownFiles(agentIds: string[]) {
  // Mapping agent IDs to their names
  const agentMapping: Record<string, string> = {
    'competitor_analysis': 'Competitor Watchdog',
    'product_recommendations': 'Product Recommendations',
    'trend_identification': 'Trend Analyst',
    'content_creation': 'Content Creator',
    'sales_enablement': 'Sales Strategist'
  };
  
  // Map agentId to the corresponding markdown filename
  const fileMapping: Record<string, string> = {
    'competitor_analysis': 'competitor_analysis.md',
    'product_recommendations': 'product_recommendations.md',
    'trend_identification': 'trend_identification.md',
    'content_creation': 'content_creation.md',
    'sales_enablement': 'sales_enablement.md'
  };
  
  // Path to the marketing_ai output directory
  const outputDir = path.join(process.cwd(), '..', 'marketing_ai', 'marketing_ai', 'output');
  console.log(`Marketing API checking for markdown files in: ${outputDir}`);
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    console.warn(`Output directory does not exist, creating: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // List all files in the output directory
  try {
    const files = fs.readdirSync(outputDir);
    console.log(`Files in output directory: ${files.join(', ') || 'none'}`);
  } catch (error) {
    console.error(`Error reading output directory: ${error}`);
  }
  
  // Generate results for each agent
  const results = agentIds.map((agentId) => {
    const agentName = agentMapping[agentId] || agentId;
    const fileName = fileMapping[agentId];
    
    console.log(`Processing agent: ${agentId}, mapped to file: ${fileName || 'unknown'}`);
    
    if (!fileName) {
      return {
        agentId,
        agentName,
        output: '',
        timestamp: new Date().toISOString(),
        status: 'error',
        error: `No markdown file mapping found for agent: ${agentId}`,
        source: 'none'
      };
    }
    
    const filePath = path.join(outputDir, fileName);
    console.log(`Checking for markdown file: ${filePath}`);
    
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      try {
        // Read the markdown file
        const output = fs.readFileSync(filePath, 'utf8');
        console.log(`Successfully read markdown file: ${filePath}`);
        
        return {
          agentId,
          agentName,
          output,
          timestamp: new Date().toISOString(),
          status: 'completed',
          source: 'file'
        };
      } catch (error) {
        console.error(`Error reading markdown file ${filePath}:`, error);
        return {
          agentId,
          agentName,
          output: '',
          timestamp: new Date().toISOString(),
          status: 'error',
          error: `Error reading markdown file: ${(error as Error).message}`,
          source: 'none'
        };
      }
    } else {
      // File does not exist
      console.log(`Markdown file not found: ${filePath}`);
      return {
        agentId,
        agentName,
        output: '',
        timestamp: new Date().toISOString(),
        status: 'processing', // Set as processing instead of error
        source: 'none'
      };
    }
  });
  
  console.log(`Marketing API processed ${results.length} agents`);
  return results;
} 