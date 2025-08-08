const { spawn } = require('child_process');
const path = require('path');

// Test the path quoting fix
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    // Apply the same fix we implemented
    let proc;
    if (process.platform === 'win32') {
      // For Windows, properly quote arguments that contain spaces
      const quotedArgs = args.map(arg => {
        if (arg.includes(' ') && !arg.startsWith('"')) {
          return `"${arg}"`;
        }
        return arg;
      });
      
      console.log(`Quoted args: ${quotedArgs.join(' ')}`);
      
      proc = spawn(command, quotedArgs, {
        ...options,
        shell: true,
        windowsHide: true
      });
    } else {
      proc = spawn(command, args, options);
    }
    
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with code ${code}: ${stderr}`);
        error.stderr = stderr;
        error.stdout = stdout;
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    proc.on('error', (err) => {
      err.stderr = stderr;
      err.stdout = stdout;
      reject(err);
    });
  });
}

async function testPathFix() {
  try {
    console.log('Testing path fix for spaces in directory names...\n');
    
    const scriptPath = path.join(process.cwd(), 'webcrawler', 'webcrawler', 'website_agent.py');
    console.log(`Script path: ${scriptPath}`);
    console.log(`Script exists: ${require('fs').existsSync(scriptPath)}`);
    
    console.log('\n--- Testing with --help ---');
    const output = await runCommand('python', [scriptPath, '--help'], {
      cwd: path.dirname(scriptPath),
      timeout: 15000
    });
    
    console.log('SUCCESS! Script executed without path errors.');
    console.log('Output preview:', output.substring(0, 200) + '...');
    
    // Check for expected arguments
    const requiredArgs = ['--urls', '--query', '--save_path'];
    const foundArgs = requiredArgs.filter(arg => output.includes(arg));
    
    console.log(`\nFound required arguments: ${foundArgs.join(', ')}`);
    
    if (foundArgs.length === requiredArgs.length) {
      console.log('✅ All required arguments found - the fix is working!');
    } else {
      console.log('⚠️  Some arguments missing, but no path errors occurred.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes("can't open file")) {
      console.error('The path quoting fix did not resolve the issue.');
    }
  }
}

testPathFix();
