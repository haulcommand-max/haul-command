const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            let t = fs.readFileSync(p, 'utf8');
            let o = t;
            
            // Fix "Ã¢â‚¬Â¦" -> "..."
            o = o.replace(/Ã¢â‚¬Â¦/g, '...');
            
            // Fix "Ã¢â‚¬" -> "-" (usually happened inside quotes in jsx: value="Ã¢â‚¬")
            // Wait, actually I'll just change the raw byte characters.
            // Let's replace any run of non-ascii characters that are invalid with a simple dash or dot.
            
            // Or better yet, just target the specific files that failed:
            if (p.includes('profile\\page.tsx') || p.includes('profile/page.tsx')) {
                o = o.replace(/Ã¢â‚¬\"/g, '"-"');
                o = o.replace(/Ã¢â‚¬/g, '-');
                o = o.replace(/Ã¢\" \'/g, "→'");
            }
            if (p.includes('admin\\trust\\page.tsx') || p.includes('admin/trust/page.tsx')) {
                o = o.replace(/\"¢/g, "•"); // 28, 49
            }
            if (p.includes('LoadBoardClient.tsx')) {
                o = o.replace(/Ã¢â‚¬\"/g, '-'); // 430
                o = o.replace(/Ã¢â‚¬/g, '-');
            }
            if (p.includes('OperatorDashboardClient.tsx')) {
                o = o.replace(/Ã¢â‚¬\"/g, '-'); // 488
                o = o.replace(/Ã¢â‚¬/g, '-');
            }
            if (p.includes('screenshots\\page.tsx') || p.includes('screenshots/page.tsx')) {
                o = o.replace(/\"¢/g, "•");
            }
            if (p.includes('emergency\\nearby\\page.tsx') || p.includes('emergency/nearby/page.tsx')) {
                o = o.replace(/Ã¢â‚¬\"/g, '-'); 
                o = o.replace(/Ã¢â‚¬/g, '-');
            }
            // Just be safe
            o = o.replace(/Ã¢\" \'/g, "");

            if (o !== t) {
                fs.writeFileSync(p, o, 'utf8');
                console.log('Fixed', p);
            }
        }
    }
}
walk('app');
