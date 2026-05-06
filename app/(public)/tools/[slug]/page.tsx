import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FAMILY_META: Record<string, { label: string; color: string; icon: string }> = {
  rates: { label: 'Rates & Pricing', color: '#22c55e', icon: '\u{1F4B2}' },
  load: { label: 'Load Analysis', color: '#3b82f6', icon: '\u{1F4E6}' },
  escort: { label: 'Escort Intelligence', color: '#f59e0b', icon: '\u{1F697}' },
  permit: { label: 'Permits & Authorities', color: '#ef4444', icon: '\u{1F4CB}' },
  data: { label: 'Market Intelligence', color: '#8b5cf6', icon: '\u{1F4CA}' },
  compliance: { label: 'Compliance & Documents', color: '#10b981', icon: '\u{2705}' },
  route: { label: 'Route Compliance', color: '#06b6d4', icon: '\u{1F6E3}' },
  certification: { label: 'Certification & Training', color: '#a78bfa', icon: '\u{1F393}' },
  claim: { label: 'Profile & Claims', color: '#f472b6', icon: '\u{1F464}' },
  broker: { label: 'Broker Operations', color: '#fb923c', icon: '\u{1F91D}' },
  enterprise: { label: 'Enterprise & API', color: '#38bdf8', icon: '\u{1F3E2}' },
  localization: { label: 'Localization', color: '#34d399', icon: '\u{1F30D}' },
  infrastructure: { label: 'Infrastructure', color: '#94a3b8', icon: '\u{1F3D7}' },
};

interface Props { params: Promise<{ slug: string }> }

async function getTool(slug: string) {
  const { data } = await supabase
    .from('hc_tool_registry')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

async function getRelated(family: string, currentSlug: string) {
  const { data } = await supabase
    .from('hc_tool_registry')
    .select('slug, name, short_desc, status, page_url')
    .eq('family', family)
    .neq('slug', currentSlug)
    .neq('status', 'internal_only')
    .order('status')
    .limit(8);
  return data ?? [];
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('hc_tool_registry')
    .select('slug')
    .neq('status', 'internal_only');
  return (data ?? []).map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) return { title: 'Tool Not Found | Haul Command' };
  const title = `${tool.name} | Free Heavy Haul Tool | Haul Command`;
  const description = tool.short_desc || `${tool.name} \u2014 free heavy haul intelligence tool covering 120 countries.`;
  return {
    title,
    description,
    alternates: { canonical: `https://www.haulcommand.com/tools/${slug}` },
    openGraph: { title, description, url: `https://www.haulcommand.com/tools/${slug}`, siteName: 'Haul Command', type: 'website' },
    other: { 'color-scheme': 'dark' },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) notFound();

  const related = await getRelated(tool.family, slug);
  const fam = FAMILY_META[tool.family] || { label: tool.family, color: '#C6923A', icon: '\u{1F527}' };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.short_desc || `${tool.name} \u2014 free heavy haul tool.`,
    url: `https://www.haulcommand.com/tools/${slug}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  const scopeLabel = tool.coverage_scope === '120_countries' ? '120 Countries'
    : tool.coverage_scope === 'us_only' ? 'United States'
    : tool.coverage_scope === 'selected_countries' ? 'Select Markets'
    : 'Global';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#F5F5F0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>

          {/* Breadcrumb */}
          <nav style={{ fontSize: 12, color: '#64748b', marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools" style={{ color: '#C6923A', textDecoration: 'none', fontWeight: 600 }}>All Tools</Link>
            <span>/</span>
            <Link href={`/tools#family-${tool.family}`} style={{ color: fam.color, textDecoration: 'none', fontWeight: 600 }}>{fam.label}</Link>
            <span>/</span>
            <span style={{ color: '#94a3b8' }}>{tool.name}</span>
          </nav>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: `${fam.color}15`, color: fam.color, border: `1px solid ${fam.color}30` }}>
                {fam.icon} {fam.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                Free &middot; {scopeLabel}
              </span>
              {tool.primary_audience && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, background: 'rgba(148,163,184,0.06)', color: '#64748b', border: '1px solid rgba(148,163,184,0.1)' }}>
                  For: {tool.primary_audience}s
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              {tool.name}
            </h1>
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 700 }}>
              {tool.short_desc || `${tool.name} \u2014 a free heavy haul intelligence tool from Haul Command.`}
            </p>
          </div>

          {/* Tool Interface Area */}
          <div style={{
            background: '#141820', borderRadius: 20, padding: 'clamp(24px, 4vw, 48px)',
            border: '1px solid #1e2530', marginBottom: 48, minHeight: 320,
            display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
            textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>{fam.icon}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#F5F5F0' }}>
              {tool.name}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, maxWidth: 480, lineHeight: 1.6 }}>
              {tool.coverage_scope === '120_countries'
                ? 'Available across all 120 countries in the Haul Command network.'
                : tool.coverage_scope === 'us_only'
                  ? 'Currently available for United States operations.'
                  : 'Available in select markets.'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              <Link href="/claim" style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #C6923A, #E4B872)',
                color: '#0B0B0C', fontWeight: 800, fontSize: 13,
                textDecoration: 'none', letterSpacing: '0.03em',
              }}>
                Claim Free Listing
              </Link>
              <Link href="/directory" style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'rgba(148,163,184,0.08)', border: '1px solid #1e2530',
                color: '#94a3b8', fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
              }}>
                Find Operators
              </Link>
            </div>
          </div>

          {/* Related Tools */}
          {related.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#F5F5F0' }}>
                More {fam.label} Tools
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {related.map(r => (
                  <Link
                    key={r.slug}
                    href={`/tools/${r.slug}`}
                    style={{
                      display: 'block', padding: 16, borderRadius: 12,
                      background: '#111318', border: '1px solid #1a1d23',
                      textDecoration: 'none', transition: 'border-color 0.2s',
                    }}
                    className="hc-tool-card"
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F0', marginBottom: 6 }}>{r.name}</div>
                    {r.short_desc && (
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{r.short_desc}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to tools */}
          <div style={{ textAlign: 'center' as const, paddingTop: 24, borderTop: '1px solid #1e2530' }}>
            <Link href="/tools" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12,
              background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.2)',
              color: '#C6923A', fontWeight: 700, fontSize: 13,
              textDecoration: 'none',
            }}>
              &larr; Browse All 293 Tools
            </Link>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `.hc-tool-card:hover { border-color: #C6923A !important; }` }} />
      </div>
    </>
  );
}
