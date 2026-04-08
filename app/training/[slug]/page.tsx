import type { Metadata } from 'next';
import Link from 'next/link';
import { MODULES } from '../page';
import ModuleDetail from './_ModuleDetail';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return MODULES.map(m => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mod = MODULES.find(m => m.slug === slug);
  const title = mod?.title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const desc = mod?.description ??
    `Complete the ${title} module to earn your HC certification. Built on FMCSA and SC&RA Best Practices.`;
  return {
    title: `${title} — Pilot Car Training | Haul Command`,
    description: desc,
    alternates: { canonical: `https://www.haulcommand.com/training/${slug}` },
    openGraph: {
      title: `${title} | Haul Command Training`,
      description: desc,
      url: `https://www.haulcommand.com/training/${slug}`,
    },
  };
}

const TIER_COLOR: Record<string, string> = {
  'HC Certified': '#A8A8A8',
  'AV-Ready': '#F5A623',
  'Elite': '#E5E4E2',
};

const gold = '#D4A844';

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const mod = MODULES.find(m => m.slug === slug);

  // Schema
  const schema = mod ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: mod.title,
      description: mod.description,
      provider: { '@type': 'Organization', name: 'Haul Command', sameAs: 'https://www.haulcommand.com' },
      url: `https://www.haulcommand.com/training/${mod.slug}`,
      timeRequired: `PT${mod.duration.replace(' min', 'M')}`,
      isAccessibleForFree: mod.isFree,
      educationalLevel: mod.tier,
      teaches: mod.outcomes,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        name: `${mod.title} - Online Certification Pathway`,
        educationalCredentialAwarded: {
          '@type': 'EducationalOccupationalCredential',
          name: `Haul Command ${mod.tier} Certification`,
          credentialCategory: 'Certificate',
          recognizedBy: [
             { '@type': 'Organization', name: 'Evergreen Safety Council' },
             { '@type': 'Organization', name: 'Department of Transportation (DOT)' }
          ]
        }
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'EducationEvent',
      name: `${mod.title} Certification Exam`,
      description: `Official certification exam for ${mod.title} recognized by industry standards.`,
      url: `https://www.haulcommand.com/training/${mod.slug}`,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: `https://www.haulcommand.com/training/${mod.slug}` },
      organizer: { '@type': 'Organization', name: 'Haul Command' },
      offers: {
        '@type': 'Offer',
        price: mod.isFree ? '0.00' : '99.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString()
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
        { '@type': 'ListItem', position: 3, name: mod.title, item: `https://www.haulcommand.com/training/${mod.slug}` },
      ],
    }
  ] : null;

  const tierColor = mod ? (TIER_COLOR[mod.tier] ?? gold) : gold;
  const prevMod = mod ? MODULES[mod.slot - 2] : null;
  const nextMod = mod ? MODULES[mod.slot] : null;

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
          <span style={{ color: gold }}>{mod?.title ?? slug}</span>
        </div>
      </nav>

      {/* SSR hero — crawlable module intro */}
      {mod && (
        <header style={{ background: '#07090d', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(1.5rem,4vw,3rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, background: `${tierColor}18`, color: tierColor, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Module {mod.slot} · {mod.tier}
              </span>
              {mod.isFree && <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#22C55E', padding: '3px 10px', borderRadius: 20 }}>FREE</span>}
              <span style={{ fontSize: 12, color: '#6b7280' }}>⏱ {mod.duration}</span>
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.6rem,4vw,2.5rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              {mod.title}
            </h1>

            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#9ca3af', lineHeight: 1.7, maxWidth: 680 }}>
              {mod.description}
            </p>

            {/* Outcomes — always in HTML */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What you will learn</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mod.outcomes.map(o => (
                  <li key={o} style={{ fontSize: 13, color: '#d1d5db', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: tierColor }}>✓</span>{o}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/training/${mod.slug}#start`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                {mod.isFree ? '🎓 Start Free' : '🎓 Start Module'}
              </Link>
              <Link href="/training" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ← Back to All Modules
              </Link>
            </div>

            {/* Audience note */}
            <p style={{ marginTop: 14, fontSize: 12, color: '#6b7280' }}>👤 For: {mod.audience}</p>
          </div>
        </header>
      )}

      {/* Client-side interactive module content */}
      <ModuleDetail params={params} />

      {/* SSR prev/next navigation — crawlable */}
      <nav aria-label="Module navigation" style={{ background: '#07090d', borderTop: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(1.5rem,3vw,2.5rem) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {prevMod ? (
            <Link href={`/training/${prevMod.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none', flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>← Previous</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>{prevMod.title}</span>
            </Link>
          ) : <div />}
          {nextMod ? (
            <Link href={`/training/${nextMod.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none', flex: 1, minWidth: 200, textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Next →</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>{nextMod.title}</span>
            </Link>
          ) : (
            <Link href="/training" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 18px', borderRadius: 12, background: 'rgba(212,168,68,0.08)', border: '1px solid rgba(212,168,68,0.2)', textDecoration: 'none', flex: 1, minWidth: 200, textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>All done →</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A844' }}>View All Modules &amp; Pricing</span>
            </Link>
          )}
        </div>

        {/* Related links from module page */}
        <div style={{ maxWidth: 1100, margin: '20px auto 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['All Modules', '/training'],
            ['Escort Requirements', '/escort-requirements'],
            ['Pilot Car Glossary', '/glossary'],
            ['Find Operators', '/directory'],
            ['Rate Index', '/rates'],
            ['Corporate Training', '/training/corporate'],
            ['Verify a Badge', '/training/verify'],
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
