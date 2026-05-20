import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Press | Haul Command',
  description: 'Haul Command press resources, journalist source desk, media contact, and source-backed heavy-haul asset library.',
};

export default function PressPage() {
  const resources = [
    {
      href: '/press/source-desk',
      title: 'Journalist Source Desk',
      desc: 'Request quotes, data context, operator/source introductions, or visual assets for heavy-haul coverage.',
    },
    {
      href: '/linkable-assets',
      title: 'Linkable Asset Library',
      desc: 'Review staged maps, guides, checklists, visuals, and embed-ready asset briefs before source-backed publication.',
    },
    {
      href: '/data-products',
      title: 'Market Intelligence',
      desc: 'Explore data-product surfaces for derived, aggregated heavy-haul market intelligence.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F14', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Press</h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 48 }}>
          Source requests, media contact, and source-backed asset paths for heavy-haul, oversize transport, pilot-car, and logistics coverage.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {resources.map((resource) => (
            <Link key={resource.href} href={resource.href} style={{ display: 'block', padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{resource.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{resource.desc}</p>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 48, padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 8px' }}>Media Inquiries</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            Contact <a href="mailto:press@haulcommand.com" style={{ color: '#F1A91B' }}>press@haulcommand.com</a> for interviews, source requests, visuals, and company information.
          </p>
        </div>
      </div>
    </div>
  );
}
