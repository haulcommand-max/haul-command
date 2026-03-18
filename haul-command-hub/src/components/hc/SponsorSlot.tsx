import type { HCSponsor } from '@/lib/hc-types';
import { supabaseServer } from '@/lib/supabase-server';

interface SponsorSlotProps {
  /** Direct sponsor data — bypasses lookup */
  sponsor?: HCSponsor | null;
  /** Page context key to look up sponsor inventory (matches slot_key in hc_sponsor_inventory) */
  context?: string;
}

/**
 * HCSponsorSlot — truth-gated sponsor placement.
 * 
 * Uses hc_sponsor_inventory.slot_key to match sponsors to pages.
 * Never renders without proper labeling (data-sponsor attribute).
 * Falls back silently if no eligible sponsor exists.
 */
export async function HCSponsorSlot({ sponsor, context }: SponsorSlotProps) {
  let activeSponsor = sponsor ?? null;

  // Look up sponsor inventory if context is provided
  if (!activeSponsor && context) {
    try {
      const sb = supabaseServer();
      const now = new Date().toISOString();
      const { data } = await sb
        .from('hc_sponsor_inventory')
        .select('*')
        .eq('slot_key', context)
        .eq('eligible', true)
        .eq('quality_guardrail_pass', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('sponsor_score', { ascending: false })
        .maybeSingle();

      if (data) {
        const label = (data.sponsor_label as 'sponsored' | 'featured' | 'promoted') ?? 'sponsored';
        activeSponsor = {
          label,
          sponsorName: data.slot_key,
          headline: `${label === 'featured' ? 'Featured' : 'Sponsored'} Partner`,
          cta: {
            id: `sponsor-${data.slot_key}`,
            label: 'Learn More',
            href: data.canonical_url ?? '#',
            type: 'navigate',
            priority: 'primary',
            trackingEvent: 'sponsor_click',
          },
        };
      }
    } catch {
      // Table may not be populated yet — silent fallback
    }
  }

  if (!activeSponsor) return null;

  return (
    <aside data-sponsor className="sponsor-slot bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider border border-white/10 rounded px-1.5 py-0.5">
          {activeSponsor.label}
        </span>
        <span className="text-xs text-gray-500">{activeSponsor.sponsorName}</span>
      </div>
      <h4 className="text-sm font-bold text-white mb-1">{activeSponsor.headline}</h4>
      {activeSponsor.body && <p className="text-xs text-gray-400 mb-3">{activeSponsor.body}</p>}
      <a href={activeSponsor.cta.href} className="inline-block bg-accent/10 text-accent text-xs font-bold px-4 py-2 rounded-lg hover:bg-accent/20 transition-colors">
        {activeSponsor.cta.label}
      </a>
    </aside>
  );
}
