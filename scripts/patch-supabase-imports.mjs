import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', 'app');
const rootComps = path.join(__dirname, '..', 'components');

const serverPattern = /import \{.*createServerComponentClient.*\} from ['"]@supabase\/auth-helpers-nextjs['"];?/g;
const clientPattern = /import \{.*createClientComponentClient.*\} from ['"]@supabase\/auth-helpers-nextjs['"];?/g;
const routeHandlerClientPattern = /import \{.*createRouteHandlerClient.*\} from ['"]@supabase\/auth-helpers-nextjs['"];?/g;

const serverReplacement = `import { createServerComponentClient } from '@/lib/supabase/server-auth';`;
const clientReplacement = `import { createClient as createClientComponentClient } from '@/lib/supabase/client';`;
const routeHandlerReplacement = `import { createServerComponentClient as createRouteHandlerClient } from '@/lib/supabase/server-auth';`;

function patchFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            patchFiles(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (serverPattern.test(content)) {
                content = content.replace(serverPattern, serverReplacement);
                modified = true;
            }
            if (clientPattern.test(content)) {
                content = content.replace(clientPattern, clientReplacement);
                modified = true;
            }
            if (routeHandlerClientPattern.test(content)) {
                content = content.replace(routeHandlerClientPattern, routeHandlerReplacement);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Patched:', fullPath);
            }
        }
    }
}

patchFiles(rootDir);
patchFiles(rootComps);
console.log('Patching complete');
