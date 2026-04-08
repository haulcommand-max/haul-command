const required = (value: string | undefined, key: string): string => {
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const optional = (value: string | undefined, fallback: string = ""): string => {
  return value || fallback;
};

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  ),
  SUPABASE_SERVICE_ROLE_KEY: required(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  ),
  INTERNAL_WORKER_TOKEN: optional(
    process.env.INTERNAL_WORKER_TOKEN,
    "dev-worker-token",
  ),
  INTERNAL_APP_BASE_URL: optional(
    process.env.INTERNAL_APP_BASE_URL,
    "http://localhost:3000",
  ),
};

