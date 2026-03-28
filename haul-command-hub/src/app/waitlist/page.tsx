import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Coming Soon | Haul Command',
  description: 'This feature is currently under active development. Join the waitlist for early access.',
};

export default function WaitlistPage({ searchParams }: { searchParams: { feature?: string } }) {
  const feature = searchParams?.feature ? searchParams.feature.replace(/-/g, ' ').toUpperCase() : 'NEW FEATURE';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '4rem 1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>🚀 COMING SOON</span>
        </div>
        
        <h1 style={{ margin: '0 0 16px', fontSize: 40, fontWeight: 900, color: '#f9fafb', letterSpacing: -1 }}>
          {feature}
        </h1>
        
        <p style={{ margin: '0 0 40px', fontSize: 16, color: '#9ca3af', lineHeight: 1.6 }}>
          We are actively building the infrastructure for this module. Our swarm AI agents and engineering teams are finalizing the core capabilities. 
          Enter your email to secure early beta access before the public launch.
        </p>

        <form action="/api/waitlist" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto' }}>
          <input type="hidden" name="feature" value={searchParams?.feature || 'general'} />
          <input 
            type="email" 
            name="email"
            placeholder="Enter your email address..." 
            required
            style={{ 
              padding: '16px 24px', 
              borderRadius: 12, 
              border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(255,255,255,0.03)', 
              color: 'white',
              fontSize: 16,
              outline: 'none',
              width: '100%'
            }} 
          />
          <button 
            type="submit" 
            style={{ 
              padding: '16px 24px', 
              background: 'linear-gradient(135deg, #F1A91B, #d97706)', 
              color: '#000', 
              fontSize: 16, 
              fontWeight: 800, 
              borderRadius: 12, 
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Get Priority Access
          </button>
        </form>

        <div style={{ marginTop: 48 }}>
          <Link href="/" style={{ color: '#F1A91B', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
