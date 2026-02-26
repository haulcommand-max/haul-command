/**
 * Slack / Webhook Notifier
 *
 * Usage:
 *   node scripts/ops/notify.mjs --status=success --title="Prod Deploy" --url="https://..."
 *   node scripts/ops/notify.mjs --status=fail --title="Corridor Job Failed" --details="timeout after 30s"
 *
 * Env: SLACK_WEBHOOK_URL
 */

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * @param {{ status: 'success'|'fail'|'warn', title: string, details?: string, url?: string, fields?: Record<string,string> }} opts
 */
export async function notify({ status, title, details, url, fields }) {
    if (!WEBHOOK_URL) {
        console.log(`[notify] No SLACK_WEBHOOK_URL set — skipping. status=${status} title=${title}`);
        return;
    }

    const color = status === 'success' ? '#22c55e' : status === 'fail' ? '#ef4444' : '#f59e0b';
    const emoji = status === 'success' ? '✅' : status === 'fail' ? '❌' : '⚠️';

    const sha = process.env.GITHUB_SHA?.slice(0, 7) || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
    const repo = process.env.GITHUB_REPOSITORY || 'haul-command';
    const branch = process.env.GITHUB_REF_NAME || 'main';

    const fieldBlocks = fields
        ? Object.entries(fields).map(([k, v]) => ({ type: 'mrkdwn', text: `*${k}:* ${v}` }))
        : [];

    const payload = {
        blocks: [
            {
                type: 'header',
                text: { type: 'plain_text', text: `${emoji} ${title}`, emoji: true },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Repo:* ${repo}` },
                    { type: 'mrkdwn', text: `*Branch:* ${branch}` },
                    { type: 'mrkdwn', text: `*SHA:* \`${sha}\`` },
                    { type: 'mrkdwn', text: `*Status:* ${status.toUpperCase()}` },
                    ...fieldBlocks,
                ],
            },
        ],
        attachments: [
            {
                color,
                text: [
                    details ? `> ${details}` : null,
                    url ? `<${url}|Open>` : null,
                ].filter(Boolean).join('\n'),
            },
        ],
    };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            console.error(`[notify] Slack webhook returned ${res.status}: ${await res.text()}`);
        } else {
            console.log(`[notify] Slack alert sent: ${title}`);
        }
    } catch (err) {
        console.error(`[notify] Failed to send Slack alert:`, err.message);
    }
}

// ── CLI mode ──
if (process.argv[1]?.endsWith('notify.mjs')) {
    const args = Object.fromEntries(
        process.argv.slice(2)
            .filter(a => a.startsWith('--'))
            .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')]; })
    );

    notify({
        status: args.status || 'warn',
        title: args.title || 'Haul Command Alert',
        details: args.details || undefined,
        url: args.url || undefined,
    });
}
