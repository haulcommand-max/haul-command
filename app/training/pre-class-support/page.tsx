'use client';

import React from 'react';
import Link from 'next/link';

export default function PreClassSupportPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8', fontFamily: "'Inter', sans-serif" }}>
      <section style={{
        background: 'linear-gradient(160deg, #0c0c0c 0%, #101018 100%)',
        padding: '80px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid #1a1a22',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700,
          color: '#ef4444', letterSpacing: '0.06em', marginBottom: 20,
        }}>
          ðŸ”§ TECHNICAL SUPPORT
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900, margin: '0 0 20px',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 0%, #fca5a5 70%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Pre-Class Tech Support
        </h1>
        <p style={{ fontSize: 18, color: '#8a8a9a', maxWidth: 680, margin: '0 auto', lineHeight: 1.65 }}>
          Don't wait until class begins to figure out your software. Download your materials, test your hardware, and finalize your setup for Haul Command's certification courses.
        </p>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1a1a22' }}>
          Step 1: Check Your Hardware
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 64 }}>
           {[
             { title: 'Reliable Internet', desc: 'At least 5 Mbps upload/download to stream video and interactive modules without dropping.', icon: 'ðŸ“¶'},
             { title: 'Working Webcam', desc: 'You MUST have your webcam on at all times during Live Online portions to meet DOT proctoring rules.', icon: 'ðŸ“·'},
             { title: 'Working Microphone', desc: 'Required for interactive assessments, instructor Q&A, and scenario roleplays.', icon: 'ðŸŽ¤'},
           ].map((item, i) => (
             <div key={i} style={{ background: '#111118', padding: 24, borderRadius: 16, border: '1px solid #1a1a22' }}>
                 <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                 <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
                 <p style={{ fontSize: 14, color: '#8a8a9a', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
             </div>
           ))}
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1a1a22' }}>
          Step 2: Install Video Conferencing
        </h2>
        <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 16, padding: 32, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', marginBottom: 64 }}>
            <div style={{ flex: 1, minWidth: 300 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Zoom Client for Meetings</h3>
                <p style={{ color: '#8a8a9a', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                    Live components of the Washington PEVO and Haul Command Elite Tracks require a verified Zoom installation. Chromebooks and tablets are supported, but laptops/desktops are strongly recommended.
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                    <a href="https://zoom.us/download" target="_blank" rel="noreferrer" style={{ background: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                        Download Zoom
                    </a>
                    <a href="https://zoom.us/test" target="_blank" rel="noreferrer" style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '12px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                        Test Your Audio / Video
                    </a>
                </div>
            </div>
            <div style={{ padding: 24, background: '#0a0a0f', borderRadius: 12, border: '1px dashed #2a2a3a', width: '100%', maxWidth: 300 }}>
                <div style={{ color: '#ef4444', fontWeight: 800, marginBottom: 12, fontSize: 14 }}>WARNING:</div>
                <div style={{ color: '#e8e8e8', fontSize: 14, lineHeight: 1.5 }}>
                    Students driving or in a moving vehicle during class will be removed without a refund per FMCSA and state laws. You must be stationary.
                </div>
            </div>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1a1a22' }}>
          Step 3: Download Student Materials
        </h2>
        <p style={{ color: '#8a8a9a', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
            Depending on your certification track, you may need to download official handbooks prior to class. Instructors will reference these page-by-page.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 64 }}>
           {[
             { title: 'Washington PEVO Handbook (2025)', track: 'WA_PEVO' },
             { title: 'WITPAC Pre-Course Info', track: 'WITPAC' },
             { title: 'Haul Command Platform Guide', track: 'HC AV-Ready' },
           ].map((doc, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#111118', borderRadius: 12, border: '1px solid #1a1a22' }}>
                <div>
                   <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{doc.title}</div>
                   <div style={{ fontSize: 12, color: '#F5A623' }}>Track: {doc.track}</div>
                </div>
                <button aria-label="Interactive Button" style={{ background: '#2a2a3a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                   Download PDF
                </button>
             </div>
           ))}
        </div>

        <div style={{ textAlign: 'center', padding: 48, background: 'linear-gradient(135deg, rgba(37,99,235,0.1), transparent)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 20 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Still Need Help?</h3>
            <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 24 }}>Book a 10-minute setup session with our tech support team before the day of your class.</p>
            <Link href="/contact" style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>
                Contact IT Support
            </Link>
        </div>
      </section>
    </div>
  );
}