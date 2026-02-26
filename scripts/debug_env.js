
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('C:\\Users\\PC User\\Biz\\.env.local');
console.log('Reading:', envPath);

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');

    lines.forEach(line => {
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            console.log('Found SUPABASE_SERVICE_ROLE_KEY line.');
            const rawVal = line.substring('SUPABASE_SERVICE_ROLE_KEY='.length);
            console.log('Raw value length:', rawVal.length);
            console.log('First 5 chars:', rawVal.substring(0, 5));
            console.log('Last 5 chars:', rawVal.substring(rawVal.length - 5));

            // trimming
            const trimmed = rawVal.trim();
            console.log('Trimmed length:', trimmed.length);

            // quote check
            if (trimmed.startsWith('"')) console.log('Starts with double quote');
            if (trimmed.endsWith('"')) console.log('Ends with double quote');
        }
    });

} catch (e) {
    console.error(e);
}
