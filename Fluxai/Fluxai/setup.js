const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Get the current directory
const currentDir = __dirname;

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('-----------------------------------------------------');
console.log('🖼️  Image Generator Agent - Environment Setup Helper 🖼️');
console.log('-----------------------------------------------------');
console.log('\nThis script will help you set up the Python environment correctly.');

// Check if Python is installed
function checkPythonInstallation() {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python --version' : 'python3 --version';
    const output = execSync(pythonCommand, { encoding: 'utf8' });
    console.log(`✅ ${output.trim()} is installed`);
    return true;
  } catch (error) {
    console.error('❌ Python is not installed or not in your PATH');
    console.log('\nPlease install Python 3.8 or higher from https://www.python.org/downloads/');
    return false;
  }
}

// Check if pip is installed
function checkPipInstallation() {
  try {
    const pipCommand = process.platform === 'win32' ? 'pip --version' : 'pip3 --version';
    const output = execSync(pipCommand, { encoding: 'utf8' });
    console.log(`✅ ${output.trim()}`);
    return true;
  } catch (error) {
    console.error('❌ pip is not installed or not in your PATH');
    return false;
  }
}

// Check for .env file
function checkEnvFile() {
  const envPath = path.join(currentDir, '.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('FAL_API_KEY=')) {
      if (envContent.includes('FAL_API_KEY=your-fal-api-key-here') || envContent.trim() === 'FAL_API_KEY=') {
        console.log('⚠️  Warning: Your API key appears to be a placeholder. Please update it with your real key.');
      } else {
        console.log('✅ API key found in .env file');
      }
    } else {
      console.log('❌ FAL_API_KEY not found in .env file');
      return false;
    }
    return true;
  } else {
    console.log('❌ .env file not found');
    return false;
  }
}

// Install dependencies
function installDependencies() {
  try {
    const requirementPath = path.join(currentDir, 'requirement.txt');
    if (!fs.existsSync(requirementPath)) {
      console.error('❌ requirement.txt file not found');
      
      // Create the requirements file
      fs.writeFileSync(requirementPath, 'fal_client\npython-dotenv\n');
      console.log('✅ Created requirement.txt file');
    }
    
    console.log('\nInstalling Python dependencies...');
    const pipCommand = process.platform === 'win32' ? 'pip install -r requirement.txt' : 'pip3 install -r requirement.txt';
    execSync(pipCommand, { encoding: 'utf8', stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    return false;
  }
}

// Create .env file
function createEnvFile(apiKey) {
  try {
    const envPath = path.join(currentDir, '.env');
    fs.writeFileSync(envPath, `FAL_API_KEY=${apiKey}\n`);
    console.log('✅ .env file created with your API key');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    return false;
  }
}

// Test the setup
function testSetup() {
  try {
    console.log('\nTesting image generation setup...');
    const testScript = `
    import os
    import sys
    from dotenv import load_dotenv

    # Load environment variables from .env file
    load_dotenv()

    # Get API key from environment variables
    fal_api_key = os.getenv("FAL_API_KEY")
    if not fal_api_key:
        print("❌ Error: FAL_API_KEY environment variable not set.")
        sys.exit(1)
    else:
        print("✅ Successfully loaded API key from .env file")
        
    try:
        import fal_client
        print("✅ Successfully imported fal_client module")
    except ImportError as e:
        print(f"❌ Error importing fal_client: {e}")
        sys.exit(1)
        
    print("✅ Setup test completed successfully")
    `;
    
    const testScriptPath = path.join(os.tmpdir(), 'test_image_generator.py');
    fs.writeFileSync(testScriptPath, testScript);
    
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    execSync(`${pythonCommand} "${testScriptPath}"`, { encoding: 'utf8', stdio: 'inherit' });
    
    console.log('\n🎉 All tests passed! Your environment is set up correctly.');
    console.log('\nYou can now use the Image Generator Agent in MercadoVista.');
    
    // Clean up
    fs.unlinkSync(testScriptPath);
    
    return true;
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    return false;
  }
}

// Main function
async function main() {
  const pythonInstalled = checkPythonInstallation();
  if (!pythonInstalled) {
    rl.close();
    return;
  }
  
  const pipInstalled = checkPipInstallation();
  if (!pipInstalled) {
    rl.close();
    return;
  }
  
  const envExists = checkEnvFile();
  if (!envExists) {
    console.log('\nYou need to create a .env file with your FAL API key.');
    rl.question('Enter your FAL API key (from https://www.fal.ai/): ', (apiKey) => {
      if (!apiKey.trim()) {
        console.log('❌ API key cannot be empty');
        rl.close();
        return;
      }
      
      createEnvFile(apiKey.trim());
      installDependencies();
      testSetup();
      rl.close();
    });
  } else {
    installDependencies();
    testSetup();
    rl.close();
  }
}

// Run the main function
main(); 