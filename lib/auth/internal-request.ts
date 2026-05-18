export function isInternalRequest(headers: Headers): boolean {
  const authHeader = headers.get('authorization');
  const apiKey = headers.get('x-api-key');
  const allowedBearerTokens = [process.env.CRON_SECRET, process.env.INTERNAL_API_KEY]
    .filter(Boolean)
    .map((token) => `Bearer ${token}`);

  return Boolean(
    (authHeader && allowedBearerTokens.includes(authHeader)) ||
      (process.env.INTERNAL_API_KEY && apiKey === process.env.INTERNAL_API_KEY),
  );
}
