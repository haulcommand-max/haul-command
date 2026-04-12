const fs = require('fs');
let c = fs.readFileSync('app/training/page.tsx', 'utf8');

c = c.replace(/ðŸ›¡ï¸ /g, ''); // Remove corrupted shield
c = c.replace(/â†’/g, '→'); // Replace corrupted arrow
c = c.replace(/â€”/g, '—'); // Replace corrupted em-dash
c = c.replace(/Start Your Certification/g, '<ShieldCheck className="w-4 h-4 mr-2" /> Start Your Certification');
// Wait, the button text might already be inside a span or directly in the button. Let's be safer:

// Hero CTA
c = c.replace(/>ðŸ›¡ï¸  Start Your Certification<\/button>/g, ' className="flex items-center justify-center"><ShieldCheck className="w-4 h-4 mr-2" /> Start Your Certification</button>');
// If it's a Link or something:
c = c.replace(/>ðŸ›¡ï¸  Start Your Certification/g, ' className="flex items-center justify-center"><ShieldCheck className="w-4 h-4 mr-2" /> Start Your Certification');

// Secondary CTA
c = c.replace(/View All Programs â†’/g, 'View All Programs →');

// Paragraph text Em-Dash
c = c.replace(/SC&RA â€” the same standards/g, 'SC&RA — the same standards');

fs.writeFileSync('app/training/page.tsx', c);
console.log('Fixed text-node mojibake.');
