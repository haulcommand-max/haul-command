/**
 * Split migrations into smaller chunks for browser SQL editor
 * Each chunk is a standalone block that can be pasted and executed independently
 */
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = 'C:\\Users\\PC User\\Documents\\Playground\\db\\migrations';
const OUTPUT_DIR = 'C:\\Users\\PC User\\Documents\\Playground\\db\\chunks';

const MIGRATIONS = [
    '0001_hc_core.sql',
    '0002_broker_intelligence.sql',
    '0003_seed_intelligence_baseline.sql',
];

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const migration of MIGRATIONS) {
    const filePath = path.join(MIGRATIONS_DIR, migration);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const baseName = path.basename(migration, '.sql');

    // Remove begin/commit wrapping
    let body = sql
        .replace(/^\s*begin\s*;\s*\n/i, '')
        .replace(/\n\s*commit\s*;\s*$/i, '');

    // Split on double newlines between statements, but keep compound blocks together
    // Strategy: split on patterns where a statement ends and a new one begins
    const chunks = [];
    let current = '';
    const lines = body.split('\n');

    let inBlock = false;  // inside DO $$ ... $$; or CREATE FUNCTION
    let blockDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Track block depth
        if (/^(do|create\s+or\s+replace\s+function|create\s+function)/i.test(trimmed)) {
            inBlock = true;
        }
        if (trimmed === '$$;' || trimmed === 'end;' && lines[i + 1]?.trim() === '$$;') {
            // End of block coming
        }

        current += line + '\n';

        // Check if we're at a natural break point (empty line after semicolon, not in a block)
        if (trimmed === '' && current.trim().endsWith(';') && !inBlock) {
            if (current.trim().length > 10) {
                chunks.push(current.trim());
                current = '';
            }
        }

        // Check for end of DO/function block
        if (trimmed === '$$;') {
            inBlock = false;
            if (current.trim().length > 10) {
                chunks.push(current.trim());
                current = '';
            }
        }
    }

    if (current.trim().length > 10) {
        chunks.push(current.trim());
    }

    // Merge small chunks to target ~100-200 lines each
    const merged = [];
    let accumulator = '';
    let accLines = 0;
    const TARGET_LINES = 150;

    for (const chunk of chunks) {
        const chunkLines = chunk.split('\n').length;
        if (accLines + chunkLines > TARGET_LINES && accumulator.length > 0) {
            merged.push(accumulator.trim());
            accumulator = chunk;
            accLines = chunkLines;
        } else {
            accumulator += '\n\n' + chunk;
            accLines += chunkLines;
        }
    }
    if (accumulator.trim().length > 0) {
        merged.push(accumulator.trim());
    }

    console.log(`\n📄 ${migration}: ${lines.length} lines → ${merged.length} chunks`);

    for (let i = 0; i < merged.length; i++) {
        const outFile = path.join(OUTPUT_DIR, `${baseName}_chunk_${String(i + 1).padStart(2, '0')}.sql`);
        const chunkContent = `-- ${migration} chunk ${i + 1}/${merged.length}\n${merged[i]}`;
        fs.writeFileSync(outFile, chunkContent);
        console.log(`  chunk ${i + 1}: ${merged[i].split('\n').length} lines → ${outFile}`);
    }
}

console.log(`\n✅ All chunks written to ${OUTPUT_DIR}`);
console.log('\nTo apply: paste each chunk into Supabase SQL editor and run.');
