import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type RegulatoryWatchStatus =
  | 'monitoring'
  | 'comment_open'
  | 'comment_closed'
  | 'decided'
  | 'implemented'
  | 'withdrawn'
  | 'appeal';

export interface RegulatoryWatchItem {
  id: string;
  country_code: string;
  agency_name: string;
  docket_id: string | null;
  title: string;
  summary: string | null;
  plain_english: string | null;
  affected_rules: string[];
  affected_roles: string[];
  affected_vehicle_types: string[];
  affected_corridors: string[];
  status: RegulatoryWatchStatus;
  company_requesting: string | null;
  requested_change: string | null;
  comment_deadline: string | null;
  decision_date: string | null;
  source_urls: string[];
  risk_score: number;
  opportunity_score: number;
  monetization_tags: string[];
  haul_command_relevance: string[];
  page_slug: string | null;
  is_published: boolean;
  requires_human_review: boolean;
  created_at: string;
  updated_at: string;
}

function normalizeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
}

function normalizeWatchItem(row: any): RegulatoryWatchItem {
  return {
    ...row,
    affected_rules: normalizeJsonArray(row.affected_rules),
    affected_roles: normalizeJsonArray(row.affected_roles),
    affected_vehicle_types: normalizeJsonArray(row.affected_vehicle_types),
    affected_corridors: normalizeJsonArray(row.affected_corridors),
    source_urls: normalizeJsonArray(row.source_urls),
    monetization_tags: normalizeJsonArray(row.monetization_tags),
    haul_command_relevance: normalizeJsonArray(row.haul_command_relevance),
  } as RegulatoryWatchItem;
}

export async function getWatchItem(docketId: string): Promise<RegulatoryWatchItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regulatory_watch_items')
    .select('*')
    .eq('docket_id', docketId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeWatchItem(data);
}

export async function getWatchItemBySlug(pageSlug: string): Promise<RegulatoryWatchItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regulatory_watch_items')
    .select('*')
    .eq('page_slug', pageSlug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeWatchItem(data);
}

export async function listOpenItems(countryCode = 'US'): Promise<RegulatoryWatchItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regulatory_watch_items')
    .select('*')
    .eq('country_code', countryCode)
    .eq('status', 'comment_open')
    .order('comment_deadline', { ascending: true });

  if (error || !data) return [];
  return data.map(normalizeWatchItem);
}

export async function listByRole(role: string): Promise<RegulatoryWatchItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regulatory_watch_items')
    .select('*')
    .contains('affected_roles', [role])
    .order('comment_deadline', { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return data.map(normalizeWatchItem);
}

export async function listByAffectedRule(rule: string): Promise<RegulatoryWatchItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regulatory_watch_items')
    .select('*')
    .contains('affected_rules', [rule])
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(normalizeWatchItem);
}

export async function getItemsByCorridors(corridorKeys: string[]): Promise<RegulatoryWatchItem[]> {
  if (corridorKeys.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('regulatory_watch_items')
    .select('*')
    .overlaps('affected_corridors', corridorKeys)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(normalizeWatchItem);
}

export function isIndexableRegulatoryItem(item: RegulatoryWatchItem) {
  return item.is_published === true && item.requires_human_review === false;
}

export function buildRegulatoryJsonLd(item: RegulatoryWatchItem) {
  const canonicalPath = item.page_slug ? `/${item.page_slug}` : `/regulations/us/fmcsa/${item.docket_id}`;
  const canonicalUrl = `https://www.haulcommand.com${canonicalPath}`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: item.title,
      description: item.summary ?? item.plain_english ?? item.title,
      url: canonicalUrl,
      dateModified: item.updated_at,
      author: { '@type': 'Organization', name: 'Haul Command' },
      publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
      about: {
        '@type': 'GovernmentOrganization',
        name: item.agency_name,
      },
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `What is ${item.docket_id}?`,
          acceptedAnswer: { '@type': 'Answer', text: item.plain_english ?? item.summary ?? item.title },
        },
        {
          '@type': 'Question',
          name: 'Who is affected by this regulatory item?',
          acceptedAnswer: { '@type': 'Answer', text: item.affected_roles.join(', ') || 'Heavy haul, safety, and compliance teams.' },
        },
      ],
    },
  ];
}
