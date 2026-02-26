/**
 * listmonk REST API Client
 * 
 * Wraps the self-hosted listmonk instance for:
 *  - Subscriber management (add, remove, update)
 *  - Campaign creation (broadcasts)
 *  - List management
 * 
 * Requires env vars: LISTMONK_URL, LISTMONK_API_USER, LISTMONK_API_PASSWORD
 */

// ─── Types ───────────────────────────────────────────────────────
export interface ListmonkSubscriber {
    id?: number;
    email: string;
    name: string;
    status: 'enabled' | 'disabled' | 'blocklisted';
    lists?: number[];
    attribs?: Record<string, any>;
}

export interface ListmonkCampaign {
    id?: number;
    name: string;
    subject: string;
    body: string;
    content_type: 'richtext' | 'html' | 'markdown' | 'plain';
    lists: number[];
    type: 'regular' | 'optin';
    tags?: string[];
}

export interface ListmonkList {
    id: number;
    name: string;
    type: 'public' | 'private';
    subscriber_count?: number;
}

// ─── Config ──────────────────────────────────────────────────────
function getConfig() {
    const url = process.env.LISTMONK_URL;
    const user = process.env.LISTMONK_API_USER || 'admin';
    const password = process.env.LISTMONK_API_PASSWORD;

    if (!url || !password) {
        throw new Error('[listmonk] Missing LISTMONK_URL or LISTMONK_API_PASSWORD env vars');
    }

    return { url: url.replace(/\/$/, ''), user, password };
}

function authHeaders(): Record<string, string> {
    const { user, password } = getConfig();
    const encoded = Buffer.from(`${user}:${password}`).toString('base64');
    return {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/json',
    };
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
    const { url } = getConfig();
    const res = await fetch(`${url}/api${path}`, {
        method,
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[listmonk] ${method} ${path} failed (${res.status}): ${errText}`);
    }

    return res.json();
}

// ─── Subscribers ─────────────────────────────────────────────────

/**
 * Add or update a subscriber in listmonk.
 * If the email already exists, it will be updated.
 */
export async function addSubscriber(
    email: string,
    name: string,
    listIds: number[],
    attribs?: Record<string, any>
): Promise<ListmonkSubscriber> {
    const payload = {
        email,
        name,
        status: 'enabled',
        lists: listIds,
        attribs: attribs || {},
        preconfirm_subscriptions: true, // Skip double opt-in for transactional adds
    };

    try {
        const data = await request<{ data: ListmonkSubscriber }>('POST', '/subscribers', payload);
        return data.data;
    } catch (err: any) {
        // If subscriber already exists, try to update
        if (err.message.includes('already exists') || err.message.includes('409')) {
            return updateSubscriber(email, name, listIds, attribs);
        }
        throw err;
    }
}

/**
 * Update an existing subscriber by querying by email first.
 */
export async function updateSubscriber(
    email: string,
    name: string,
    listIds: number[],
    attribs?: Record<string, any>
): Promise<ListmonkSubscriber> {
    // Look up subscriber by email
    const searchResult = await request<{ data: { results: ListmonkSubscriber[] } }>(
        'GET',
        `/subscribers?query=subscribers.email='${encodeURIComponent(email)}'&per_page=1`
    );

    const existing = searchResult.data?.results?.[0];
    if (!existing?.id) {
        throw new Error(`[listmonk] Subscriber not found for update: ${email}`);
    }

    const payload = {
        email,
        name,
        status: 'enabled',
        lists: listIds,
        attribs: { ...(existing.attribs || {}), ...(attribs || {}) },
    };

    const data = await request<{ data: ListmonkSubscriber }>('PUT', `/subscribers/${existing.id}`, payload);
    return data.data;
}

/**
 * Remove/blocklist a subscriber by email.
 */
export async function removeSubscriber(email: string): Promise<void> {
    const searchResult = await request<{ data: { results: ListmonkSubscriber[] } }>(
        'GET',
        `/subscribers?query=subscribers.email='${encodeURIComponent(email)}'&per_page=1`
    );

    const existing = searchResult.data?.results?.[0];
    if (existing?.id) {
        await request('PUT', `/subscribers/${existing.id}`, {
            ...existing,
            status: 'blocklisted',
        });
    }
}

// ─── Lists ───────────────────────────────────────────────────────

/**
 * Get all lists from listmonk.
 */
export async function getLists(): Promise<ListmonkList[]> {
    const data = await request<{ data: { results: ListmonkList[] } }>('GET', '/lists?per_page=100');
    return data.data?.results || [];
}

// ─── Campaigns ───────────────────────────────────────────────────

/**
 * Create and optionally start a campaign.
 */
export async function createCampaign(
    name: string,
    subject: string,
    body: string,
    listIds: number[],
    options: { tags?: string[]; autoStart?: boolean } = {}
): Promise<ListmonkCampaign> {
    const payload: ListmonkCampaign = {
        name,
        subject,
        body,
        content_type: 'html',
        lists: listIds,
        type: 'regular',
        tags: options.tags || [],
    };

    const data = await request<{ data: ListmonkCampaign }>('POST', '/campaigns', payload);
    const campaign = data.data;

    if (options.autoStart && campaign.id) {
        await request('PUT', `/campaigns/${campaign.id}/status`, { status: 'running' });
    }

    return campaign;
}

/**
 * Health check — verify listmonk is reachable.
 */
export async function healthCheck(): Promise<boolean> {
    try {
        await request('GET', '/health');
        return true;
    } catch {
        return false;
    }
}
