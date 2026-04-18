const fs = require('fs');
let c = fs.readFileSync('app/training/page.tsx', 'utf8');

// Ensure correct React icons are used instead of emojis/mojibake
c = c.replace(/import Link from 'next\/link';/, `import Link from 'next/link';\nimport { ShieldCheck, Globe, Zap, ClipboardCheck, Landmark } from 'lucide-react';`);

// Force dynamic so fallback logic correctly executes on Vercel without stale caching
if (!c.includes('export const revalidate = 0;')) {
  c = c.replace(/export default async function TrainingHome\(\) \{/, "export const revalidate = 0;\nexport const dynamic = 'force-dynamic';\n\nexport default async function TrainingHome() {");
}

// Fix Top Nav Pills
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*'Built on FMCSA \+ SC&RA Standards'\s*\}/, "{ icon: <ShieldCheck className=\"w-3.5 h-3.5\" />, text: 'Built on FMCSA + SC&RA Standards' }");
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*`\$\{countryCount \|\| 120\} countries`\s*\}/, "{ icon: <Globe className=\"w-3.5 h-3.5\" />, text: `${countryCount || 120} countries` }");
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*`\$\{catalog\.length \|\| 8\} training programs`\s*\}/, "{ icon: <Zap className=\"w-3.5 h-3.5\" />, text: `${catalog.length || 8} training programs` }");

// Restore standard padding on top nav pills to counter too dark
c = c.replace(/padding: '4px 12px',\s*fontSize: 11/g, "padding: '6px 14px',\n                fontSize: 12");
c = c.replace(/background: 'rgba\(245,166,35,0\.1\)'/g, "background: 'rgba(245,166,35,0.15)'");

// Fix Bottom Standards Icons
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*'FMCSA Best Practices Aligned',\s*sub:\s*'Federal standard'\s*\}/, "{ icon: <ShieldCheck className=\"w-8 h-8 text-[#F5A623] mx-auto\" />, text: 'FMCSA Best Practices Aligned', sub: 'Federal standard' }");
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*'SC&RA Guidelines Compliant',\s*sub:\s*'Industry standard'\s*\}/, "{ icon: <ClipboardCheck className=\"w-8 h-8 text-[#F5A623] mx-auto\" />, text: 'SC&RA Guidelines Compliant', sub: 'Industry standard' }");
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*`\$\{countryCount \|\| 120\} Countries Accepted`,\s*sub:\s*'Global recognition'\s*\}/, "{ icon: <Globe className=\"w-8 h-8 text-[#F5A623] mx-auto\" />, text: `${countryCount || 120} Countries Accepted`, sub: 'Global recognition' }");
// Note: Some previous chunks used 'countries' while others used 'Countries Accepted'
c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*`\$\{countryCount \|\| 120\} countries`,\s*sub:\s*'Global recognition'\s*\}/, "{ icon: <Globe className=\"w-8 h-8 text-[#F5A623] mx-auto\" />, text: `${countryCount || 120} Countries Accepted`, sub: 'Global recognition' }");

c = c.replace(/\{\s*icon:\s*['"][^'"]+['"],\s*text:\s*'Exceeds 12 State Standards',\s*sub:\s*'WA, AZ, CO, FL, GA \+ more'\s*\}/, "{ icon: <Landmark className=\"w-8 h-8 text-[#F5A623] mx-auto\" />, text: 'Exceeds 12 State Standards', sub: 'WA, AZ, CO, FL, GA + more' }");

// Replace raw emoji calls in render if any
c = c.replace(/<span>\{b\.icon\}<\/span>/, "<span>{b.icon}</span>");
c = c.replace(/<div style=\{\{ fontSize: 36, marginBottom: 16 \}\}>\{item\.icon\}<\/div>/, "<div style={{ marginBottom: 16 }}>{item.icon}</div>");
c = c.replace(/<div style=\{\{ fontSize: 28, marginBottom: 8 \}\}>\{item\.icon\}<\/div>/, "<div style={{ marginBottom: 16 }}>{item.icon}</div>");

fs.writeFileSync('app/training/page.tsx', c);
console.log('Fixed training page mojibake, applied lucide-react icons, and enforced force-dynamic to fix caching empty states.');
