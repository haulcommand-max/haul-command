import { supabaseServer } from '@/lib/supabase-server';
import type { HCProfile, HCFreshness } from '@/lib/hc-types';
import { countryName } from '@/lib/directory-helpers';

/**
 * Provider profile loader — must read:
 *   - hc_provider_best_public_record (primary)
 *   - hc_global_operators (real verified fallback)
 *   - hc_page_seo_contracts (SEO metadata)
 */

export async function getProviderProfile(slug: string): Promise<HCProfile | null> {
  const sb = supabaseServer();

  // Try hc_provider_best_public_record first
  const { data: pubRecord } = await sb
    .from('hc_provider_best_public_record')
    .select('*')
    .eq('provider_slug', slug)
    .maybeSingle();

  if (pubRecord) {
    const freshness: HCFreshness = {
      lastUpdatedAt: pubRecord.last_updated_at ?? new Date().toISOString(),
      updateLabel: pubRecord.last_updated_at ? `Updated ${timeSince(pubRecord.last_updated_at)}` : 'Recently added',
      sourceCount: pubRecord.source_count ?? 1,
    };
    return {
      id: pubRecord.provider_id,
      slug: pubRecord.provider_slug,
      entityType: pubRecord.entity_type ?? 'operator',
      displayName: pubRecord.display_name,
      tagline: undefined,
      description: undefined,
      verificationState: pubRecord.verification_state ?? 'unverified',
      contact: {
        phoneE164: pubRecord.phone_e164 ?? undefined,
        phoneDisplay: pubRecord.phone_display ?? undefined,
        smsE164: pubRecord.sms_e164 ?? undefined,
        websiteUrl: pubRecord.website_url ?? undefined,
        email: pubRecord.email ?? undefined,
      },
      serviceAreaLabels: pubRecord.service_area_labels ?? [],
      capabilities: pubRecord.capabilities ?? [],
      badges: [],
      freshness,
      claimStatus: pubRecord.claim_status ?? 'unclaimed',
      primaryActions: [
        ...(pubRecord.phone_e164 ? [{ id: 'call', label: 'Call', href: `tel:${pubRecord.phone_e164}`, type: 'call' as const, priority: 'primary' as const }] : []),
        { id: 'claim', label: 'Claim Profile', href: `/claim?slug=${slug}`, type: 'claim' as const, priority: 'secondary' as const },
      ],
    };
  }

  // Fallback to hc_global_operators (real verified data)
  const { data: opData } = await sb.from('hc_global_operators')
    .select('id, slug, name, entity_type, city, admin1_code, country_code, phone, email, claim_status')
    .eq('slug', slug)
    .maybeSingle();

  if (opData) {
    const freshness: HCFreshness = {
      lastUpdatedAt: new Date().toISOString(),
      updateLabel: 'Verified data',
      sourceCount: 1,
    };
    return {
      id: opData.id,
      slug: opData.slug,
      entityType: opData.entity_type ?? 'operator',
      displayName: opData.name,
      tagline: undefined,
      description: undefined,
      verificationState: opData.claim_status === 'claimed' ? 'claimed' : 'unverified',
      contact: {
        phoneE164: opData.phone ?? undefined,
        phoneDisplay: opData.phone ?? undefined,
        websiteUrl: undefined,
        email: opData.email ?? undefined,
      },
      serviceAreaLabels: [opData.city, opData.admin1_code, countryName(opData.country_code)].filter(Boolean) as string[],
      capabilities: opData.entity_type ? [opData.entity_type] : [],
      badges: [],
      freshness,
      claimStatus: opData.claim_status === 'claimed' ? 'claimed' : 'unclaimed',
      primaryActions: [
        ...(opData.phone ? [{ id: 'call', label: 'Call', href: `tel:${opData.phone}`, type: 'call' as const, priority: 'primary' as const }] : []),
        { id: 'claim', label: 'Claim Profile', href: `/claim?slug=${slug}`, type: 'claim' as const, priority: 'secondary' as const },
      ],
    };
  }

  // Last resort fallback to hc_places (infrastructure/legacy)
  const { data } = await sb.from('hc_places')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) return null;

  const fallbackFreshness: HCFreshness = {
    lastUpdatedAt: data.updated_at ?? new Date().toISOString(),
    updateLabel: data.updated_at ? `Updated ${timeSince(data.updated_at)}` : 'Recently added',
    sourceCount: 1,
  };

  return {
    id: data.id,
    slug: data.slug,
    entityType: 'operator',
    displayName: data.name,
    tagline: data.description?.substring(0, 120) ?? undefined,
    description: data.description ?? undefined,
    verificationState: data.claim_status === 'claimed' ? 'claimed' : 'unverified',
    contact: {
      phoneE164: data.phone ?? undefined,
      phoneDisplay: data.phone ?? undefined,
      smsE164: data.phone ?? undefined,
      websiteUrl: data.website ?? undefined,
    },
    serviceAreaLabels: [data.locality, data.admin1_code, countryName(data.country_code)].filter(Boolean) as string[],
    capabilities: data.surface_category_key ? [data.surface_category_key] : [],
    badges: [],
    freshness: fallbackFreshness,
    claimStatus: data.claim_status === 'claimed' ? 'claimed' : 'unclaimed',
    primaryActions: [
      ...(data.phone ? [{ id: 'call', label: 'Call', href: `tel:${data.phone}`, type: 'call' as const, priority: 'primary' as const }] : []),
      { id: 'claim', label: 'Claim Profile', href: `/claim?slug=${slug}`, type: 'claim' as const, priority: 'secondary' as const },
    ],
  };
}

export async function getProviderSeoContract(slug: string) {
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_page_seo_contracts')
    .select('title, meta_description, h1, intro_copy')
    .eq('canonical_url', `/place/${slug}`)
    .single();
  return data;
}

export async function getNearbyProviders(countryCode: string, category: string, excludeId: string, limit = 6) {
  const sb = supabaseServer();
  // Real operators from hc_global_operators
  const { data } = await sb.from('hc_global_operators')
    .select('id, slug, name, city, admin1_code')
    .eq('country_code', countryCode)
    .eq('entity_type', category)
    .neq('id', excludeId)
    .limit(limit);
  return data ?? [];
}

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
