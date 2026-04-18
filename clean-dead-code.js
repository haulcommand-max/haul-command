const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running knip to identify unused files...');
let knipOut = '';
try {
  knipOut = execSync('npx knip --reporter json', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 });
} catch (error) {
  knipOut = error.stdout || '';
}

try {
  const jsonStart = knipOut.indexOf('{');
  const jsonEnd = knipOut.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON output found.');
  }
  const cleanJson = knipOut.substring(jsonStart, jsonEnd + 1);
  const data = JSON.parse(cleanJson);
  
  if (data.files && data.files.length > 0) {
    let deletedCount = 0;
    data.files.forEach(file => {
      try {
        const fullPath = path.resolve(file);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }
      } catch (e) {
        console.error(`Error deleting ${file}:`, e.message);
      }
    });
    console.log(`Deleted ${deletedCount} dead files.`);
  } else {
    console.log('No dead files found by knip.');
  }

  // Also clean out 126 subdirectories in lib
  const libPath = path.resolve('lib');
  const whitelist = [
    'supabase', 'firebase', 'twenty', 'telematics', 'livekit', 'config', 'notifications', 'funnel', 'workflows'
  ];
  const items = fs.readdirSync(libPath);
  let deletedDirs = 0;
  for (const item of items) {
    const fullItem = path.join(libPath, item);
    if (fs.statSync(fullItem).isDirectory() && !whitelist.includes(item)) {
       fs.rmSync(fullItem, { recursive: true, force: true });
       deletedDirs++;
    }
  }
  console.log(`Nuked ${deletedDirs} unused subdirectories in lib/.`);

} catch (e) {
  console.error('Failed to parse knip output:', e);
  console.log('Raw output:', knipOut.substring(0, 500));
}
