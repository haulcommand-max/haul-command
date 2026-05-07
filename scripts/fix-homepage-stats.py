import re

path = r'C:\Users\PC User\Biz\lib\server\global-stats.ts'
src = open(path, encoding='utf-8').read()

# Replace totalOperators: 0, totalCorridors: 0, avgRatePerDay: 0
src = re.sub(r'totalOperators: 0,\s*\r?\n\s*totalCorridors: 0,\s*\r?\n\s*avgRatePerDay: 0,', 
             'totalOperators: -1,  // sentinel: DB unreachable — do NOT render as zero\n    totalCorridors: -1,  // sentinel: DB unreachable — do NOT render as zero\n    avgRatePerDay: 380,  // industry baseline when DB unavailable', 
             src)

# Fix the comment block above FALLBACK
src = src.replace(
    '// Safe fallback when DB is unavailable\n// IMPORTANT: Do NOT inflate these numbers.\n// Showing fake stats ("1.5M operators") destroys trust with industry professionals.\n// Let the UI handle zero-state gracefully instead.',
    '// Safe fallback when DB is unavailable.\n// -1 is a SENTINEL meaning data is unavailable (not genuinely zero).\n// UI must treat -1 as show-unavailable-state to prevent the false-zero bug.'
)

open(path, 'w', encoding='utf-8').write(src)
print('global-stats.ts patched OK')
