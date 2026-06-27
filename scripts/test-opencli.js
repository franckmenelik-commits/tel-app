const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = '/Users/franckmenelikafaneeko/Desktop/Projets/tel-app/logs/opencli-test.log';

try {
  fs.writeFileSync(logFile, 'Testing opencli...\n', 'utf-8');
  
  // Run opencli doctor to see if it works
  const doctorOutput = execSync('opencli doctor 2>&1', { encoding: 'utf-8' });
  fs.appendFileSync(logFile, `Doctor output:\n${doctorOutput}\n`, 'utf-8');
  
} catch (error) {
  fs.appendFileSync(logFile, `Error: ${error.message}\nStderr: ${error.stderr}\n`, 'utf-8');
}
