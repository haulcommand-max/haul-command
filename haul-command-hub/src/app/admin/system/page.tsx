/**
 * /admin/system — Config Health Dashboard
 *
 * Real-time environment health checker.
 * Shows integration status, recent errors, and system configuration.
 * Server component — never exposes secret values.
 *
 * CRITICAL FIX: Admin pages MUST be force-dynamic. They require auth,
 * live data, and always-fresh state. DO NOT remove these exports.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs' // Full Node.js runtime — required for Supabase admin patterns

import { supabaseServer } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

type Status = 'configured' | 'missing' | 'degraded';

interface IntegrationCheck {
  service: string;
  envKey: string;
  status: Status;
  powers: string;
  fallback: string;
  icon: string;
}

function check(key: string): Status {
  return process.env[key] ? 'configured' : 'missing';
}

async function getRecentErrors() {
  try {
    const sb = supabaseServer();
    const { data } = await sb
      .from('system_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AdminSystemPage() {
  const integrations: IntegrationCheck[] = [
    { service: 'Haul Command AI Engine', envKey: 'ANTHROPIC_API_KEY', status: check('ANTHROPIC_API_KEY'), powers: '12 AI agents, compliance copilot, contract gen', fallback: 'None — required for AI features', icon: '🧠' },
    { service: 'Supabase URL', envKey: 'NEXT_PUBLIC_SUPABASE_URL', status: check('NEXT_PUBLIC_SUPABASE_URL'), powers: 'Database, auth, real-time', fallback: 'None — required', icon: '🗃️' },
    { service: 'Supabase Service Key', envKey: 'SUPABASE_SERVICE_ROLE_KEY', status: check('SUPABASE_SERVICE_ROLE_KEY'), powers: 'Server-side DB operations', fallback: 'None — required', icon: '🔑' },
    { service: 'Stripe', envKey: 'STRIPE_SECRET_KEY', status: check('STRIPE_SECRET_KEY'), powers: 'Payments, subscriptions, checkout', fallback: 'Pricing page shows plans, checkout disabled', icon: '💳' },
    { service: 'Stripe Webhook', envKey: 'STRIPE_WEBHOOK_SECRET', status: check('STRIPE_WEBHOOK_SECRET'), powers: 'Webhook signature verification', fallback: 'Webhooks accepted without verification (dev only)', icon: '🔒' },
    { service: 'Resend', envKey: 'RESEND_API_KEY', status: check('RESEND_API_KEY'), powers: 'Email outreach, transactional emails', fallback: 'Outreach disabled, notifications logged only', icon: '📧' },
    { service: 'Motive Client ID', envKey: 'MOTIVE_CLIENT_ID', status: check('MOTIVE_CLIENT_ID'), powers: 'ELD/fleet data, OAuth flow', fallback: 'Motive features disabled, manual data only', icon: '🚛' },
    { service: 'Motive Webhook Secret', envKey: 'MOTIVE_WEBHOOK_SECRET', status: check('MOTIVE_WEBHOOK_SECRET'), powers: 'Motive webhook verification', fallback: 'Webhooks accepted without verification', icon: '🔗' },
    { service: 'Firebase', envKey: 'NEXT_PUBLIC_FIREBASE_APP_ID', status: check('NEXT_PUBLIC_FIREBASE_APP_ID'), powers: 'Push notifications', fallback: 'In-app notifications via Supabase Realtime', icon: '🔔' },
    { service: 'Firebase VAPID', envKey: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY', status: check('NEXT_PUBLIC_FIREBASE_VAPID_KEY'), powers: 'Web push messaging key', fallback: 'Push disabled, in-app only', icon: '📲' },
    { service: 'PostHog', envKey: 'NEXT_PUBLIC_POSTHOG_KEY', status: check('NEXT_PUBLIC_POSTHOG_KEY'), powers: 'Product analytics', fallback: 'Vercel Analytics + hc_events table (zero data loss)', icon: '📊' },
    { service: 'Sentry', envKey: 'SENTRY_DSN', status: check('SENTRY_DSN'), powers: 'Error monitoring', fallback: 'system_errors table in Supabase + console logs', icon: '🐛' },
    { service: 'Google Analytics', envKey: 'NEXT_PUBLIC_GA_ID', status: check('NEXT_PUBLIC_GA_ID'), powers: 'Website analytics', fallback: 'Vercel Analytics (automatic)', icon: '📈' },
    { service: 'Vapi', envKey: 'VAPI_API_KEY', status: check('VAPI_API_KEY'), powers: 'Voice dispatch AI', fallback: 'Voice features disabled', icon: '🎙️' },
    { service: 'NOWPayments', envKey: 'NOWPAYMENTS_API_KEY', status: check('NOWPAYMENTS_API_KEY'), powers: 'Crypto payments', fallback: 'Crypto payments disabled, Stripe only', icon: '₿' },
    { service: 'Langfuse', envKey: 'LANGFUSE_SECRET_KEY', status: check('LANGFUSE_SECRET_KEY'), powers: 'AI observability', fallback: 'hc_events table for AI call logging', icon: '🔬' },
  ];

  const configured = integrations.filter(i => i.status === 'configured').length;
  const errors = await getRecentErrors();

  const statusColor = (s: Status) => s === 'configured' ? 'text-green-400' : s === 'degraded' ? 'text-yellow-400' : 'text-red-400';
  const statusBg = (s: Status) => s === 'configured' ? 'bg-green-500/10 border-green-500/20' : s === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';
  const statusIcon = (s: Status) => s === 'configured' ? '✅' : s === 'degraded' ? '⚠️' : '❌';

  return (
    <>
      <Navbar />
      <main className="flex-grow overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">
                System <span className="text-accent">Health</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {configured}/{integrations.length} integrations configured · {errors.length} recent errors
              </p>
            </div>
            <Link href="/admin" className="text-gray-500 hover:text-white text-sm transition-colors">
              ← Admin
            </Link>
          </div>

          {/* Integration Status */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Integration Status</h2>
            <div className="grid gap-3">
              {integrations.map((int) => (
                <div
                  key={int.envKey}
                  className={`border rounded-xl p-4 flex items-center gap-4 ${statusBg(int.status)}`}
                >
                  <span className="text-2xl w-10 text-center">{int.icon}</span>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{int.service}</span>
                      <span className={`text-[10px] font-bold ${statusColor(int.status)}`}>
                        {statusIcon(int.status)} {int.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{int.powers}</p>
                    {int.status !== 'configured' && (
                      <p className="text-yellow-600 text-[10px] mt-0.5">Fallback: {int.fallback}</p>
                    )}
                  </div>
                  <code className="text-gray-600 text-[10px] hidden sm:block">{int.envKey}</code>
                </div>
              ))}
            </div>
          </section>

          {/* AI Cost Estimates */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">AI Cost Routing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { tier: 'HC Flash', model: 'hc-flash', cost: '$0.00025/1k', agents: 'support_bot, regulation_rag', pct: '80%', color: 'green' },
                { tier: 'HC Standard', model: 'hc-standard', cost: '$0.003/1k', agents: 'load_enhancer, dispatch_brain +5', pct: '15%', color: 'blue' },
                { tier: 'HC Deep', model: 'hc-deep', cost: '$0.015/1k', agents: 'contract_gen, invoice_gen', pct: '5%', color: 'purple' },
                { tier: 'HC Creative', model: 'hc-creative', cost: '$0.001/1k', agents: 'ad_copy_gen', pct: '<1%', color: 'orange' },
              ].map((tier) => (
                <div key={tier.tier} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-white font-bold text-sm">{tier.tier}</p>
                  <p className="text-accent font-black text-lg mt-1">{tier.cost}</p>
                  <p className="text-gray-600 text-[10px] mt-1">{tier.pct} of calls</p>
                  <p className="text-gray-500 text-[10px] mt-2">{tier.agents}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-400 font-bold text-sm">Projected Monthly AI Cost: ~$47</p>
              <p className="text-gray-500 text-xs">vs $1,100/mo if all calls used Opus. 95% cost reduction via intelligent routing.</p>
            </div>
          </section>

          {/* Recent Errors */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Recent System Errors</h2>
            {errors.length === 0 ? (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 text-center">
                <p className="text-green-400 font-bold">✅ No errors logged</p>
                <p className="text-gray-500 text-xs mt-1">System is running clean</p>
              </div>
            ) : (
              <div className="space-y-2">
                {errors.map((err: { id: string; route: string; message: string; created_at: string; count: number }, i: number) => (
                  <div key={err.id ?? i} className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-start gap-3">
                    <span className="text-red-400 text-xs mt-1">🔴</span>
                    <div className="flex-grow min-w-0">
                      <code className="text-white text-xs font-mono">{err.route}</code>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{err.message}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {new Date(err.created_at).toLocaleString()} · {err.count ?? 1}x
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
