const MISSING_RELATION_PATTERNS = [
  'could not find the table',
  'could not find table',
  'does not exist',
  'schema cache',
  'relation',
];

export function isMissingOptionalSupabaseRelation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code.toUpperCase() : '';
  if (code === 'PGRST205' || code === 'PGRST202' || code === '42P01') return true;

  const text = [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return MISSING_RELATION_PATTERNS.some((pattern) => text.includes(pattern));
}
