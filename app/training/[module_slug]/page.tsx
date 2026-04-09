import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import ModuleDetail from './_ModuleDetail';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ module_slug: string }>;
}

export const revalidate = 3600; // revalidate every hour for SEO

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from('training_modules').select('module_slug');
  return (data || []).map((m: any) => ({ module_slug: m.module_slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module_slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: mod } = await supabase
    .from('training_modules')
    .select('*, training_tracks(*)')
    .eq('module_slug', module_slug)
    .single();

  const title = mod?.module_title ?? module_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const desc = `Complete the ${title} module to earn your training credentials. Developed jointly by industry authorities and operators.`;
  return {
    title: `${title} — Module Training | Haul Command`,
    description: desc,
    alternates: { canonical: `https://www.haulcommand.com/training/${module_slug}` },
    openGraph: {
      title: `${title} | Haul Command Training`,
      description: desc,
      url: `https://www.haulcommand.com/training/${module_slug}`,
      images: mod?.poster_image_url ? [{ url: mod.poster_image_url }] : [],
    },
  };
}

const gold = '#D4A844';

export default async function ModulePage({ params }: Props) {
  const { module_slug } = await params;
  
  // Real server client for the components
  const supabase = await createServerClient();
  const { data: mod } = await supabase
    .from('training_modules')
    .select('*, training_tracks(*)')
    .eq('module_slug', module_slug)
    .single();

  // Schema definition
  const schema = mod ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: mod.module_title,
      description: mod.official_session_title || mod.module_title,
      provider: { '@type': 'Organization', name: 'Haul Command', sameAs: 'https://www.haulcommand.com' },
      url: `https://www.haulcommand.com/training/${mod.module_slug}`,
      timeRequired: `PT${mod.hc_estimated_minutes || 60}M`,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        name: `${mod.module_title} - Online Course`,
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
        { '@type': 'ListItem', position: 3, name: mod.module_title, item: `https://www.haulcommand.com/training/${mod.module_slug}` },
      ],
    }
  ] : null;

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}

      {/* SSR breadcrumb — always crawlable */}
      <nav aria-label="Breadcrumb" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', background: '#07090d' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/training" style={{ color: '#6b7280', textDecoration: 'none' }}>Training</Link>
          <span>›</span>
          <span style={{ color: gold }}>{mod?.module_title ?? module_slug}</span>
        </div>
      </nav>

      {/* SSR hero — crawlable module intro */}
      {mod && (
        <header style={{ background: '#07090d', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(1.5rem,4vw,3rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, background: `rgba(168,168,168,0.18)`, color: '#A8A8A8', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Module {mod.sequence_order}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>⏱ {mod.hc_estimated_minutes || mod.official_minutes} min</span>
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.6rem,4vw,2.5rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              {mod.module_title}
            </h1>

            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#9ca3af', lineHeight: 1.7, maxWidth: 680 }}>
              {mod.official_session_title || 'Engage with our highly capable training system to ensure compliance across borders.'}
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/training/${mod.module_slug}#start`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                🎓 Access Module
              </Link>
              <Link href="/training" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ← Back to Overview
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Client-side interactive module content */}
      <ModuleDetail params={params} />

      {/* Navigation Footer */}
      <nav aria-label="Module navigation" style={{ background: '#07090d', borderTop: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(1.5rem,3vw,2.5rem) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '20px auto 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['All Modules', '/training'],
            ['Escort Requirements', '/escort-requirements'],
            ['Pilot Car Glossary', '/glossary'],
            ['Find Operators', '/directory'],
            ['Rate Index', '/rates'],
            ['Claim Your Listing', '/claim'],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
