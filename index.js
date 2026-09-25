#!/usr/bin/env node

const { execSync } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  let prompt = '';
  let model = 'gpt-6-luna';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' || args[i] === '-p') {
      prompt = args[i + 1] || '';
      i++;
    } else if (args[i] === '--model' || args[i] === '-m') {
      model = args[i + 1] || 'gpt-6-luna';
      i++;
    }
  }

  return { prompt, model };
}

const { prompt, model } = parseArgs();

if (!prompt) {
  console.error('Error: --prompt (-p) is required.');
  process.exit(1);
}

const fullPrompt = `${prompt}. Just respond with the full path of the generated image`;
const command = `codex --model "${model}" exec "${fullPrompt}" --skip-git-repo-check`;

try {
  // Execute codex and combine stdout/stderr
  const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  
  // Filter output for image file extensions
  const lines = output.split('\n');
  const imagePath = lines.filter(line => /\.(png|jpg|jpeg|webp)$/i.test(line.trim())).pop();

  if (imagePath) {
    console.log(imagePath.trim());
  } else {
    console.error('No image path found in codex output.');
    process.exit(1);
  }
} catch (error) {
  // Handle stderr or execution failure
  const combinedOutput = (error.stdout || '') + '\n' + (error.stderr || '');
  const imagePath = combinedOutput.split('\n').filter(line => /\.(png|jpg|jpeg|webp)$/i.test(line.trim())).pop();

  if (imagePath) {
    console.log(imagePath.trim());
  } else {
    console.error('Execution failed:', error.message);
    process.exit(1);
  }
}
