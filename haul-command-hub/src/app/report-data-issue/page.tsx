import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report a Data Issue | HAUL COMMAND',
  description: 'Report inaccurate, outdated, or incorrect data on Haul Command. Help us maintain the most accurate heavy haul directory.',
};

export default function ReportDataIssuePage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#e8eaf0', marginBottom: '1rem' }}>
        Report a Data Issue
      </h1>
      <p style={{ color: '#8892a8', marginBottom: '2rem', lineHeight: 1.6 }}>
        We take data accuracy seriously. If you&apos;ve found incorrect information about a company,
        route, rate, or requirement on Haul Command, please let us know so we can investigate and
        correct it.
      </p>

      <section style={{
        background: 'rgba(30,34,52,0.6)',
        border: '1px solid rgba(100,120,255,0.12)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          How to Report
        </h2>
        <ol style={{ color: '#9ca3af', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
          <li>Navigate to the page with the incorrect data</li>
          <li>Note the URL and the specific information that is incorrect</li>
          <li>Email us at <a href="mailto:data@haulcommand.com" style={{ color: '#8090ff' }}>data@haulcommand.com</a> with the details</li>
        </ol>
        <p style={{ color: '#8892a8', marginTop: '1rem', fontSize: '0.9rem' }}>
          We typically investigate and respond within 24–48 hours.
        </p>
      </section>

      <section style={{
        background: 'rgba(30,34,52,0.6)',
        border: '1px solid rgba(100,120,255,0.12)',
        borderRadius: '12px',
        padding: '2rem',
      }}>
        <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Claim Your Listing
        </h2>
        <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
          If this is your company and the data is outdated, the fastest way to fix it is to{' '}
          <a href="/claim" style={{ color: '#8090ff' }}>claim your listing</a>. Verified operators
          can update their own information in real time.
        </p>
      </section>
    </main>
  );
}
