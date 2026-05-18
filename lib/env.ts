import { SITE_URL } from "@/lib/site-url";

const required = (value: string | undefined, key: string): string => {
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const optional = (value: string | undefined, fallback: string = ""): string => {
  return value || fallback;
};

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  },
  get INTERNAL_WORKER_TOKEN() {
    return optional(process.env.INTERNAL_WORKER_TOKEN, "dev-worker-token");
  },
  get INTERNAL_APP_BASE_URL() {
    return optional(process.env.INTERNAL_APP_BASE_URL, SITE_URL);
  },
};

