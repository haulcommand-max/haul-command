import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Remove a Listing | HAUL COMMAND',
  description: 'Request removal of a business listing from the Haul Command directory.',
};

export default function RemoveListingPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#e8eaf0', marginBottom: '1rem' }}>
        Remove a Listing
      </h1>
      <p style={{ color: '#8892a8', marginBottom: '2rem', lineHeight: 1.6 }}>
        If you are the authorized representative of a business listed on Haul Command and would like
        to have the listing removed, please follow the steps below.
      </p>

      <section style={{
        background: 'rgba(30,34,52,0.6)',
        border: '1px solid rgba(100,120,255,0.12)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          How to Request Removal
        </h2>
        <ol style={{ color: '#9ca3af', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
          <li>Verify you are authorized to request removal for this business</li>
          <li>Provide the listing URL and business name</li>
          <li>Email us at <a href="mailto:listings@haulcommand.com" style={{ color: '#8090ff' }}>listings@haulcommand.com</a> from the business email on file</li>
        </ol>
        <p style={{ color: '#8892a8', marginTop: '1rem', fontSize: '0.9rem' }}>
          Removal requests are typically processed within 3–5 business days after verification.
        </p>
      </section>

      <section style={{
        background: 'rgba(30,34,52,0.3)',
        border: '1px solid rgba(255,180,50,0.15)',
        borderRadius: '12px',
        padding: '2rem',
      }}>
        <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Consider Claiming Instead
        </h2>
        <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
          Rather than removing your listing, you can{' '}
          <a href="/claim" style={{ color: '#8090ff' }}>claim it</a> to take full control of the
          information displayed, add services, and receive leads.
        </p>
      </section>
    </main>
  );
}
