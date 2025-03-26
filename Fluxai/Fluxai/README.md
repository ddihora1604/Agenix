# Image Generator Agent - Setup Guide

This guide will help you set up the Image Generator Agent for MercadoVista.

## Prerequisites

- Node.js (installed with MercadoVista)
- Python 3.8 or higher
- A FAL.ai API key

## Quick Setup

For a quick automated setup, run:

```bash
# Navigate to the Fluxai directory
cd Fluxai/Fluxai

# Run the setup script
node setup.js
```

The setup script will:
1. Check if Python is installed
2. Check if pip is installed
3. Create/verify the .env file
4. Install the required dependencies
5. Test the setup

## Manual Setup

If you prefer to set up manually, follow these steps:

### 1. Install Python Dependencies

```bash
# Navigate to the Fluxai directory
cd Fluxai/Fluxai

# Install dependencies
pip install -r requirement.txt
# Or on some systems:
pip3 install -r requirement.txt
```

### 2. Set up your FAL.ai API Key

1. Create a free account at [FAL.ai](https://www.fal.ai/)
2. Get your API key from your account dashboard
3. Create a `.env` file in the `Fluxai/Fluxai` directory with the following content:

```
FAL_API_KEY=your-fal-api-key-here
```

Replace `your-fal-api-key-here` with your actual API key.

## Troubleshooting

### Python Environment Issues

- **Error**: `Python is not properly installed or accessible`
  - Solution: Ensure Python 3.8+ is installed and added to your PATH
  - Verify by running `python --version` or `python3 --version`

- **Error**: `Missing Python module: ModuleNotFoundError: No module named 'fal_client'`
  - Solution: Run `pip install fal_client python-dotenv` or use the setup script

### API Key Issues

- **Error**: `FAL API Key is missing or invalid`
  - Solution: Check your `.env` file and ensure it contains your valid FAL API key
  - Make sure the file is in the correct location (Fluxai/Fluxai/.env)

### Image Generation Issues

- **Error**: `Failed to parse image URL from output`
  - Solution: This may be a temporary issue with the FAL API. Try again later or with a different prompt

- **Slow Generation**: If image generation is taking a long time, try:
  - Using shorter, more specific prompts
  - Checking your internet connection
  - Restarting the application

## Advanced Configuration

### Optimizing Performance

To reduce the image generation time, you can:

1. Use more direct and specific prompts
2. Keep the application running to maintain the Python environment
3. Use high-speed internet connection

### API Usage Limits

Note that the FAL.ai API may have usage limits depending on your account tier:

- Free tier: Limited generations per day
- Paid tiers: Higher limits and priority queue

Check your [FAL.ai dashboard](https://www.fal.ai/) for your current usage and limits.

## Support

If you encounter issues not covered by this guide, please:

1. Check the browser console for detailed error messages
2. Verify your Python installation with `python --version`
3. Ensure all dependencies are installed with `pip list | grep fal_client`
4. Contact support with the error details 