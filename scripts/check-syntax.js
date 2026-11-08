const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = ['src', 'scripts', 'tests'];
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
}

roots.forEach(walk);
if (!files.length) {
  console.log('No JavaScript files found.');
  process.exit(0);
}

let failed = false;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    failed = true;
    console.error(`Syntax error in ${file}`);
    console.error(error.stderr?.toString() || error.message);
  }
}

if (failed) process.exit(1);
console.log(`Syntax check passed for ${files.length} file(s).`);
