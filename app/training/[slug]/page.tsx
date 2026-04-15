import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck, Clock, BookOpen, Award, CheckCircle, ArrowRight, ChevronRight, Star, Zap } from 'lucide-react';
import { HCContentPageShell, HCContentContainer, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCBadge } from '@/components/training/HCBadge';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════
// /training/[slug] — Training Course Detail
// P1 FIX: Was a blank stub saying "currently being verified."
// Now shows course curriculum, pricing, and enrollment pathway.
// ═══════════════════════════════════════════════════════════════

// Seed course data — matches the fallback catalog in training/page.tsx
const COURSE_DATA: Record<string, {
  title: string;
  tagline: string;
  description: string;
  tier: 'silver' | 'gold' | 'platinum';
  tierLabel: string;
  tierColor: string;
  price: string;
  hours: number;
  modules: number;
  modules_list: { title: string; description: string }[];
  prerequisites: string;
  outcomes: string[];
  certification: string;
  validity: string;
}> = {
  'pilot-car-operator-certification': {
    title: 'Pilot Car Operator Certification',
    tagline: 'The industry standard for escort operators',
    description: 'The comprehensive certification program for pilot car operators working in heavy haul, wind energy, oilfield, and oversize load corridors. Built on FMCSA and SC&RA Best Practices Guidelines, this program exceeds the curriculum requirements for all 12 US states that mandate pilot car certification.',
    tier: 'silver',
    tierLabel: 'HC Certified',
    tierColor: '#A8A8A8',
    price: '$299',
    hours: 40,
    modules: 12,
    modules_list: [
      { title: 'Introduction to Escort Operations', description: 'Role of the escort vehicle, legal framework, and industry overview' },
      { title: 'Vehicle Setup & Equipment Standards', description: 'Required signs, lighting, height poles, communication equipment' },
      { title: 'Route Survey & Pre-Trip Planning', description: 'Route evaluation, obstacle identification, bridge clearances' },
      { title: 'Communication Protocols', description: 'CB radio procedures, hand signals, driver coordination' },
      { title: 'Traffic Control Procedures', description: 'Intersection management, lane control, oncoming traffic' },
      { title: 'Night Operations', description: 'Visibility requirements, lighting protocols, reduced speed procedures' },
      { title: 'Highway & Interstate Operations', description: 'Merging, speed management, lane changes with oversize loads' },
      { title: 'Urban & Restricted Area Operations', description: 'City driving, utility conflicts, tight turns, loading docks' },
      { title: 'Emergency Procedures', description: 'Breakdowns, accidents, weather events, load shifts' },
      { title: 'State Regulations & Permits', description: 'Multi-state compliance, permit requirements, reciprocity' },
      { title: 'Load Types & Configurations', description: 'Superloads, wind blades, modular buildings, heavy equipment' },
      { title: 'Professionalism & Business Operations', description: 'Documentation, insurance, invoicing, broker relationships' },
    ],
    prerequisites: 'Valid driver\'s license, clean driving record, minimum 21 years of age',
    outcomes: [
      'HC Certified badge on your Operator Profile',
      '+15 Trust Score boost',
      'Broker Packet unlock — auto-generated compliance portfolio',
      'Priority matching in load board searches',
      'Digital certificate with QR verification',
    ],
    certification: 'Proctored online exam (80% passing score)',
    validity: '2 years (renewal at reduced rate)',
  },
  'av-integration-specialist': {
    title: 'AV Integration Specialist',
    tagline: 'Escort the future of freight',
    description: 'The only escort operator training specifically covering how to work alongside autonomous freight systems from Aurora, Kodiak, Waabi, and other AV companies. Covers V2X communication protocols, sensor field awareness, emergency procedures, and jurisdiction-specific AV regulations.',
    tier: 'gold',
    tierLabel: 'HC AV-Ready',
    tierColor: '#F5A623',
    price: '$899',
    hours: 24,
    modules: 8,
    modules_list: [
      { title: 'Autonomous Freight Landscape', description: 'Current AV companies, routes, and commercial deployment status' },
      { title: 'Sensor Systems & Detection Zones', description: 'LiDAR, radar, camera systems — what the truck sees and doesn\'t see' },
      { title: 'V2X Communication Protocols', description: 'Vehicle-to-everything communication, data exchange, coordination' },
      { title: 'Escort Positioning for AV Runs', description: 'Optimal spacing, staging areas, convoy formations' },
      { title: 'Emergency Procedures — AV Specific', description: 'Minimal risk conditions, remote operator handoff, system failures' },
      { title: 'Weather & Environmental Considerations', description: 'Sensor degradation, rain/snow protocols, sun glare management' },
      { title: 'Regulatory Framework', description: 'State-by-state AV laws, federal guidelines, reporting requirements' },
      { title: 'Field Practicum', description: 'Simulated AV escort scenarios with real-time decision making' },
    ],
    prerequisites: 'HC Certified badge or equivalent state certification',
    outcomes: [
      'HC AV-Ready badge — the only AV escort credential in existence',
      'Eligibility for AV corridor escort assignments',
      'Direct visibility to AV fleet operators',
      'Priority access to AV escort load board',
    ],
    certification: 'Proctored exam + scenario assessment (85% passing score)',
    validity: '1 year (technology evolves fast — annual renewal ensures currency)',
  },
  'load-securement-fundamentals': {
    title: 'Load Securement Fundamentals',
    tagline: 'Critical knowledge before you hit the road',
    description: 'A practical primer on chaining, strapping, load math, and securement inspection for escort operators. Understanding load securement helps you identify potential hazards during route survey and communicate effectively with haulers about safety concerns.',
    tier: 'silver',
    tierLabel: 'Road Ready',
    tierColor: '#A8A8A8',
    price: '$49',
    hours: 10,
    modules: 4,
    modules_list: [
      { title: 'Load Securement Fundamentals', description: 'Working load limits, securement methods, weight distribution basics' },
      { title: 'Chain & Binder Systems', description: 'Grade 70/80 chains, binder types, inspection criteria' },
      { title: 'Strapping & Blocking', description: 'Synthetic straps, edge protection, blocking and bracing' },
      { title: 'Inspection & Communication', description: 'Pre-trip securement checks, reporting protocols, hauler coordination' },
    ],
    prerequisites: 'None',
    outcomes: [
      '+5 Trust Score boost',
      'Load securement inspection competency',
      'Better communication with haulers on safety',
    ],
    certification: 'Online quiz (75% passing score)',
    validity: '3 years',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = COURSE_DATA[slug];
  const title = course?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `${title} | Haul Command Training`,
    description: course?.description || `Professional training and certification for pilot car and escort vehicle operators. ${title}.`,
    alternates: { canonical: `https://www.haulcommand.com/training/${slug}` },
  };
}

export default async function TrainingCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = COURSE_DATA[slug];
  const formattedTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // If no seed data, show an honest "coming soon" with redirect
  if (!course) {
    return (
      <HCContentPageShell>
        <div style={{
          maxWidth: 600, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center',
        }}>
          <Award style={{ width: 48, height: 48, color: '#F5A623', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f9fafb', marginBottom: 12 }}>{formattedTitle}</h1>
          <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32, lineHeight: 1.6 }}>
            This training program is being finalized and will be available for enrollment soon.
            Check the training hub for available programs.
          </p>
          <Link href="/training" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #F5A623, #e08820)',
            color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> View All Programs
          </Link>
        </div>
      </HCContentPageShell>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
    coursePrerequisites: course.prerequisites,
    hasCourseInstance: [{ '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${course.hours}H` }],
    offers: { '@type': 'Offer', price: course.price.replace('$', ''), priceCurrency: 'USD', availability: 'https://schema.org/PreOrder' },
  };

  return (
    <HCContentPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div style={{
        position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'linear-gradient(180deg, #0A0A0E, #0D0D14)', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: `radial-gradient(ellipse, ${course.tierColor}10 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 3.5rem', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 28, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            <Link href="/training" style={{ color: '#6b7280', textDecoration: 'none' }}>Training</Link>
            <ChevronRight style={{ width: 12, height: 12 }} />
            <span style={{ color: course.tierColor }}>{course.tierLabel}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <HCBadge tier={course.tier} size={52} />
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20, marginBottom: 8,
                background: `${course.tierColor}15`, border: `1px solid ${course.tierColor}30`,
                fontSize: 10, fontWeight: 800, color: course.tierColor, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {course.tierLabel}
              </span>
            </div>
          </div>

          <h1 style={{
            margin: '0 0 12px', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>
            {course.title}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 17, color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
            {course.tagline}
          </p>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { icon: <Clock style={{ width: 14, height: 14 }} />, label: `${course.hours} hours` },
              { icon: <BookOpen style={{ width: 14, height: 14 }} />, label: `${course.modules} modules` },
              { icon: <Award style={{ width: 14, height: 14 }} />, label: course.validity },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#d1d5db', fontWeight: 600 }}>
                <span style={{ color: course.tierColor }}>{s.icon}</span>
                {s.label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/onboarding" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12,
              background: `linear-gradient(135deg, ${course.tierColor}, ${course.tierColor}CC)`,
              color: '#000', fontWeight: 800, fontSize: 15, textDecoration: 'none',
              boxShadow: `0 4px 24px ${course.tierColor}40`,
            }}>
              <ShieldCheck style={{ width: 16, height: 16 }} />
              Enroll Now — {course.price}
            </Link>
            <a href="#curriculum" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#d1d5db', fontWeight: 600, fontSize: 15, textDecoration: 'none',
            }}>
              View Curriculum
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <HCContentSection>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Description */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 15, color: '#d1d5db', lineHeight: 1.75 }}>{course.description}</p>
          </div>

          {/* What You'll Earn */}
          <div style={{
            padding: '24px', borderRadius: 16,
            background: `linear-gradient(135deg, ${course.tierColor}06, ${course.tierColor}02)`,
            border: `1px solid ${course.tierColor}20`,
            marginBottom: 40,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star style={{ width: 18, height: 18, color: course.tierColor }} />
              What You&apos;ll Earn
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {course.outcomes.map(o => (
                <li key={o} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#d1d5db' }}>
                  <CheckCircle style={{ width: 16, height: 16, color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                  {o}
                </li>
              ))}
            </ul>
          </div>

          {/* Curriculum */}
          <div id="curriculum" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen style={{ width: 18, height: 18, color: course.tierColor }} />
              Curriculum — {course.modules} Modules
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {course.modules_list.map((m, i) => (
                <div key={i} style={{
                  padding: '16px 20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: `${course.tierColor}10`, border: `1px solid ${course.tierColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 900, color: course.tierColor,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb', marginBottom: 3 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{m.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites & Certification */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 48 }}>
            <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} /> Prerequisites
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{course.prerequisites}</p>
            </div>
            <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: '#22c55e' }} /> Assessment
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{course.certification}</p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{
            padding: '32px', borderRadius: 20, textAlign: 'center',
            background: `linear-gradient(135deg, ${course.tierColor}08, ${course.tierColor}03)`,
            border: `1px solid ${course.tierColor}20`,
            marginBottom: 48,
          }}>
            <HCBadge tier={course.tier} size={64} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#f9fafb', marginBottom: 8 }}>
              Ready to earn your {course.tierLabel} badge?
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Enroll now and start building your verified professional profile.
            </p>
            <Link href="/onboarding" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '16px 32px', borderRadius: 14,
              background: `linear-gradient(135deg, ${course.tierColor}, ${course.tierColor}CC)`,
              color: '#000', fontWeight: 800, fontSize: 16, textDecoration: 'none',
              boxShadow: `0 6px 30px ${course.tierColor}40`,
            }}>
              <ShieldCheck style={{ width: 16, height: 16 }} />
              Enroll — {course.price}
            </Link>
          </div>
        </div>
      </HCContentSection>

      <HCContentSection>
        <HCContentContainer>
          <NoDeadEndBlock
            heading="Explore Training & Certification"
            moves={[
              { href: '/training', icon: '🎓', title: 'All Programs', desc: 'Full training catalog', primary: true, color: '#F5A623' },
              { href: '/training/report-card', icon: '📋', title: 'Your Report Card', desc: 'Track your credentials' },
              { href: '/directory', icon: '🔍', title: 'Operator Directory', desc: 'See verified operators' },
              { href: '/tools/escort-calculator', icon: '🧮', title: 'Rate Calculator', desc: 'What to charge' },
              { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Start taking jobs' },
              { href: '/blog', icon: '📰', title: 'Intelligence', desc: 'Industry insights' },
            ]}
          />
        </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
