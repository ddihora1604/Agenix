import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Parse the query parameters
    const searchParams = req.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' }, 
        { status: 400 }
      );
    }

    console.log(`API request for markdown file with agentId: ${agentId}`);

    // Map agentId to the corresponding markdown filename
    const fileMapping: Record<string, string> = {
      'competitor_analysis': 'competitor_analysis.md',
      'product_recommendations': 'product_recommendations.md',
      'trend_identification': 'trend_identification.md',
      'content_creation': 'content_creation.md',
      'sales_enablement': 'sales_enablement.md'
    };

    const fileName = fileMapping[agentId];
    if (!fileName) {
      console.error(`Invalid agentId: ${agentId}`);
      return NextResponse.json(
        { error: 'Invalid agentId', message: `${agentId} does not map to a known markdown file` }, 
        { status: 400 }
      );
    }

    // Path to the marketing_ai output directory
    const outputDir = path.join(process.cwd(), '..', 'marketing_ai', 'marketing_ai', 'output');
    console.log(`Looking for markdown file in directory: ${outputDir}`);
    
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      console.warn(`Output directory does not exist: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
      return NextResponse.json(
        { error: 'Output directory does not exist yet', message: `Created directory: ${outputDir}` }, 
        { status: 404 }
      );
    }
    
    const filePath = path.join(outputDir, fileName);
    console.log(`Attempting to read markdown file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Markdown file not found: ${filePath}`);
      return NextResponse.json(
        { error: 'Markdown file not found', message: `File ${fileName} does not exist in ${outputDir}` }, 
        { status: 404 }
      );
    }

    // Read the markdown file
    console.log(`Reading markdown file: ${filePath}`);
    const markdownContent = fs.readFileSync(filePath, 'utf8');
    
    // Process the markdown content for proper formatting if needed
    const processedContent = processMarkdownContent(markdownContent);
    
    // If the content is empty after processing, return an error
    if (!processedContent.trim()) {
      console.error(`Markdown file is empty: ${filePath}`);
      return NextResponse.json(
        { error: 'Markdown file is empty', message: `File ${fileName} exists but contains no content` }, 
        { status: 404 }
      );
    }
    
    console.log(`Successfully read markdown file for ${agentId}`);
    return NextResponse.json({ 
      agentId,
      content: processedContent,
      timestamp: new Date().toISOString(),
      source: 'file'
    });
  } catch (error) {
    console.error('Error reading markdown file:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message }, 
      { status: 500 }
    );
  }
}

/**
 * Processes markdown content to ensure proper formatting
 * This can be extended to add any additional processing needed
 */
function processMarkdownContent(content: string): string {
  // Here you can add any processing logic to ensure 
  // the markdown content is properly formatted
  
  // Remove any BOM characters that might cause rendering issues
  let processed = content.replace(/^\uFEFF/, '');
  
  // Ensure content starts with a heading if it doesn't already
  if (!processed.trim().startsWith('#')) {
    const title = processed.split('\n')[0]?.trim();
    if (title && !title.startsWith('#')) {
      processed = `# ${title}\n\n${processed.substring(title.length).trim()}`;
    }
  }
  
  // Ensure proper newlines for markdown formatting
  processed = processed.replace(/\r\n/g, '\n');
  
  return processed;
} 