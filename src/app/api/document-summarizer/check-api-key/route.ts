import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check if the .env file exists
    const envPath = path.join(process.cwd(), 'DocSummarizer', 'DocSummarizer', '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('API key check: .env file not found');
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    
    // Read the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if it contains a valid API key
    const apiKeyMatch = envContent.match(/GOOGLE_API_KEY=([^\s]+)/);
    
    if (!apiKeyMatch || !apiKeyMatch[1] || apiKeyMatch[1].trim() === '') {
      console.log('API key check: API key not found in .env file');
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    
    // Verify the API key is not empty and has a reasonable length
    const apiKey = apiKeyMatch[1].trim();
    
    // Basic validation - API keys should be at least 20 chars
    if (apiKey.length < 20) {
      console.log('API key check: API key is too short to be valid');
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    
    console.log('API key check: Valid API key found');
    return NextResponse.json({ exists: true }, { status: 200 });
  } catch (error) {
    console.error('Error checking API key:', error);
    return NextResponse.json(
      { error: 'Failed to check API key status', exists: false },
      { status: 500 }
    );
  }
} 