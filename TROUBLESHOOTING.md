# Troubleshooting Guide

This guide addresses common issues that may occur when using the Marketing AI Agents Workflow application, particularly with the markdown display feature.

## Markdown Files Not Displaying

If the workflow results section shows "Processing..." but doesn't display any content:

### Check Output Directory Structure

1. Verify that the output directory exists:
   ```
   /marketing_ai/marketing_ai/output/
   ```

2. If the directory doesn't exist, create it:
   ```
   mkdir -p marketing_ai/marketing_ai/output
   ```

### Generate Sample Markdown Files

1. Run the sample file generation script:
   ```
   node scripts/create-sample-markdown.js
   ```

2. Verify that the files were created in the output directory:
   ```
   dir marketing_ai/marketing_ai/output
   ```

   You should see the following files:
   - competitor_analysis.md
   - product_recommendations.md
   - trend_identification.md
   - content_creation.md
   - sales_enablement.md

### Check Console for Errors

1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the Console tab
3. Look for any error messages related to API calls or file access
4. Common errors include:
   - 404 Not Found: The markdown file doesn't exist
   - 500 Internal Server Error: Issue with reading or processing the file

### Verify API Endpoints

Test the markdown API endpoint directly in your browser or using curl:

```
curl http://localhost:3000/api/markdown?agentId=competitor_analysis
```

If this returns a 404 error, the file doesn't exist. If it returns a 200 with content, then the issue is with the frontend display.

## "Processing" State Persists

If agents remain in the "Processing" state indefinitely:

1. Check that the polling mechanism is working:
   - Look for "Checking for markdown files..." messages in the console
   - Verify that the agents are configured with the correct backend IDs

2. Try manually refreshing the page and re-running the workflow

3. If using Windows, ensure file paths are formatted correctly with backslashes in the appropriate places

## File Content Not Updating

If you've updated a markdown file but the content in the UI doesn't reflect the changes:

1. Make sure the workflow is still in the "running" state
2. Check that the polling interval is working (log messages in console)
3. Try clicking on a different agent tab and then back to the one you're interested in
4. If all else fails, restart the workflow execution

## Markdown Formatting Issues

If the markdown content displays but the formatting is incorrect:

1. Check the markdown file's content directly to ensure it has proper formatting
2. Verify that the `processMarkdownContent` function in `api/markdown/route.ts` is correctly processing the content
3. Ensure your markdown adheres to standard markdown syntax

## Path Resolution Problems

If you encounter path resolution issues:

1. Check that the path construction in the API routes is correct for your operating system
2. For Windows systems, ensure paths use the correct format:
   ```javascript
   const outputDir = path.join(process.cwd(), '..', 'marketing_ai', 'marketing_ai', 'output');
   ```

3. Verify the current working directory with:
   ```javascript
   console.log('Current working directory:', process.cwd());
   ```

## Backend Connection Issues

If the frontend isn't properly connecting to the backend:

1. Make sure the file structure follows the expected pattern:
   ```
   /AgenticAI
     /NANgry_birds
     /marketing_ai
       /marketing_ai
         /output
   ```

2. Check network requests in the browser's Network tab to see if API calls are being made correctly

## Resolving Common Scenarios

### Scenario 1: Empty Output Directory

**Symptoms**: All agents show "Processing..." indefinitely
**Solution**: Run the sample markdown generation script:
```
node scripts/create-sample-markdown.js
```

### Scenario 2: Missing Trend Identification File

**Symptoms**: Only the Trend Analyst agent shows "Processing..."
**Solution**: Create the missing file:
```javascript
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'marketing_ai', 'marketing_ai', 'output');
const file = path.join(dir, 'trend_identification.md');
fs.writeFileSync(file, '# Market Trend Analysis\n\nThis is sample content.');
```

### Scenario 3: API Returns 404

**Symptoms**: Console shows 404 errors when polling for markdown files
**Solution**: Check that the filenames in the API routes match the actual files:
```javascript
// In api/markdown/route.ts
const fileMapping = {
  'competitor_analysis': 'competitor_analysis.md',
  'product_recommendations': 'product_recommendations.md',
  'trend_identification': 'trend_identification.md',
  'content_creation': 'content_creation.md',
  'sales_enablement': 'sales_enablement.md'
};
```

## Getting Additional Help

If you continue to experience issues after trying these troubleshooting steps, please:

1. Check the GitHub repository for known issues
2. Open a new issue with details about your environment and the specific problem
3. Include relevant console logs and error messages

For immediate assistance, reach out to your system administrator or development team. 