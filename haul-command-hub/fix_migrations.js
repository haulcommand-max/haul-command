const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let i = 0;
const newVersions = [];

for (const file of files) {
  let [ver, ...rest] = file.split('_');
  
  // If the version isn't 14 digits, or the second part is also numbers (e.g. 120100)
  if (ver.length < 14) {
    if (rest[0] && /^\d+$/.test(rest[0])) {
      // e.g. "20260318" and "120100" -> "20260318120100"
      ver = ver + rest[0];
      rest.shift();
    } else {
      // missing time, pad with 0s + index
      ver = ver.padEnd(12, '0') + String(i).padStart(2, '0');
    }
  } else if (ver.length === 14) {
    // If multiple files have the exact same 14-digit timestamp
    if (newVersions.includes(ver)) {
      ver = String(BigInt(ver) + 1n);
    }
  }
  
  const newName = `${ver}_${rest.join('_')}`;
  if (newName !== file) {
    console.log(`Renaming: ${file} -> ${newName}`);
    fs.renameSync(path.join(migrationsDir, file), path.join(migrationsDir, newName));
  }
  newVersions.push(ver);
}

// Revert bad statuses
const badVersions = ['20260318', '20260321', '20260322', '20260323', '20260324'];
for (const bad of badVersions) {
  try {
    console.log(`Reverting ${bad}...`);
    execSync(`npx supabase migration repair --status reverted ${bad}`, { stdio: 'inherit' });
  } catch (e) {} // ignore errors
}

// Mark new ones as applied
for (const ver of newVersions) {
  try {
    console.log(`Marking ${ver} as applied...`);
    execSync(`npx supabase migration repair --status applied ${ver}`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to mark ${ver}: ${e.message}`);
  }
}
