// ============================================================
// Infisical — Secrets Management
// Use for: central secrets, rotation, env separation
// ============================================================

const INFISICAL_TOKEN = process.env.INFISICAL_TOKEN || '';
const INFISICAL_API_URL = process.env.INFISICAL_API_URL || 'https://app.infisical.com/api';

interface SecretInput {
    key: string;
    environment: 'dev' | 'staging' | 'production';
    path?: string;
}

// ── Fetch a secret from Infisical ──
export async function getSecret(input: SecretInput): Promise<string | null> {
    if (!INFISICAL_TOKEN) {
        console.warn('[Infisical] No token — falling back to env');
        return process.env[input.key] || null;
    }

    const params = new URLSearchParams({
        environment: input.environment,
        secretName: input.key,
        workspacePath: input.path || '/',
    });

    const res = await fetch(`${INFISICAL_API_URL}/v3/secrets/raw/${input.key}?${params}`, {
        headers: { Authorization: `Bearer ${INFISICAL_TOKEN}` },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.secret?.secretValue || null;
}

// ── Batch fetch secrets ──
export async function getSecrets(
    environment: 'dev' | 'staging' | 'production',
    path: string = '/'
): Promise<Record<string, string>> {
    if (!INFISICAL_TOKEN) return {};

    const params = new URLSearchParams({ environment, workspacePath: path });
    const res = await fetch(`${INFISICAL_API_URL}/v3/secrets/raw?${params}`, {
        headers: { Authorization: `Bearer ${INFISICAL_TOKEN}` },
    });

    if (!res.ok) return {};
    const data = await res.json();
    const secrets: Record<string, string> = {};
    for (const s of data?.secrets || []) {
        secrets[s.secretKey] = s.secretValue;
    }
    return secrets;
}
