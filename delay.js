// Simple delay script for Windows/PowerShell compatibility
setTimeout(() => {
  const { spawn } = require('child_process');
  const path = require('path');
  
  const frontendPath = path.join(__dirname, 'frontend');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  const child = spawn(npm, ['run', 'dev'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (err) => {
    console.error('Failed to start frontend:', err);
    process.exit(1);
  });
}, 5000);

