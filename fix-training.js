const fs = require('fs');
let c = fs.readFileSync('components/training/TrainingInternalLinks.tsx', 'utf8');

const newLinkStyle = `style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 13, color: '#e2e8f0',
                        textDecoration: 'none',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 8,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#F5A623';
                        e.currentTarget.style.background = 'rgba(245,166,35,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#e2e8f0';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}`;

c = c.replace(/style=\{\{\s*display: 'flex', alignItems: 'center', gap: 8,\s*fontSize: 13, color: '#b0b0c0',\s*textDecoration: 'none',\s*padding: '6px 0',\s*borderBottom: '1px solid rgba\(255,255,255,0\.03\)',\s*transition: 'color 0\.15s',\s*\}\}\s*onMouseEnter=\{\(e\) => \{\s*e\.currentTarget\.style\.color = '#F5A623';\s*\}\}\s*onMouseLeave=\{\(e\) => \{\s*e\.currentTarget\.style\.color = '#b0b0c0';\s*\}\}\s*/, newLinkStyle);
c = c.replace(/color: '#4a4a5a', fontSize: 11/g, "color: '#6a6a7a', fontSize: 12");
c = c.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 8 \}\}>/g, "<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>");

fs.writeFileSync('components/training/TrainingInternalLinks.tsx', c);
console.log('Fixed training internal links styles.');
