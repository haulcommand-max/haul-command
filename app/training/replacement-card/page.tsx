'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HCBadge } from '@/components/training/HCBadge';

export default function ReplacementCardPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    certId: '',
    shippingAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#e8e8e8',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <section style={{
        background: 'linear-gradient(160deg, #0c0c0c 0%, #101018 100%)',
        padding: '80px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid #1a1a22',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <HCBadge tier="silver" size={64} />
        </div>
        
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 900, margin: '0 0 16px',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          color: '#fff'
        }}>
          Replacement Card Request
        </h1>

        <p style={{
          fontSize: 18, color: '#8a8a9a', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6,
        }}>
          Lost or damaged your physical Haul Command certification card? Need a fresh copy for the dash? Order a replacement. Cost: $25.00
        </p>

        {submitted ? (
          <div style={{
            maxWidth: 500, margin: '0 auto', background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)', padding: 40, borderRadius: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>âœ…</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Request Processing</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.6 }}>
              We've received your request. An invoice for $25.00 has been sent to <strong>{form.email}</strong>. 
              Once paid, your new card will ship within 2 business days.
            </p>
            <Link href="/training" style={{ display: 'inline-block', marginTop: 20, color: '#F5A623', fontWeight: 700, textDecoration: 'none' }}>
              â† Return to Training
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
             {[
               { key: 'firstName', label: 'First Name', type: 'text' },
               { key: 'lastName', label: 'Last Name', type: 'text' },
               { key: 'email', label: 'Email Address', type: 'email' },
               { key: 'phone', label: 'Phone Number', type: 'tel' },
               { key: 'certId', label: 'Certification ID (if known)', type: 'text', required: false },
             ].map((field) => (
               <div key={field.key}>
                 <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9a9ab0', marginBottom: 8 }}>
                   {field.label} {field.required !== false && '*'}
                 </label>
                 <input
                   type={field.type}
                   required={field.required !== false}
                   value={(form as Record<string, string>)[field.key]}
                   onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                   style={{
                     width: '100%', padding: '12px 14px',
                     background: '#111118', border: '1px solid #2a2a3a',
                     borderRadius: 10, color: '#fff', fontSize: 15,
                     outline: 'none', boxSizing: 'border-box',
                   }}
                   onFocus={e => e.currentTarget.style.borderColor = '#F5A623'}
                   onBlur={e => e.currentTarget.style.borderColor = '#2a2a3a'}
                 />
               </div>
             ))}

             <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9a9ab0', marginBottom: 8 }}>
                  Shipping Address *
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.shippingAddress}
                  onChange={e => setForm({ ...form, shippingAddress: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: '#111118', border: '1px solid #2a2a3a',
                    borderRadius: 10, color: '#fff', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#F5A623'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2a2a3a'}
                />
             </div>

             <button aria-label="Interactive Button" type="submit" disabled={loading} style={{
                 marginTop: 8, padding: '16px', background: loading ? 'rgba(245,166,35,0.3)' : 'linear-gradient(135deg, #F5A623, #e08820)',
                 color: '#000', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: loading ? 'wait' : 'pointer'
             }}>
                 {loading ? 'Submitting...' : 'Request Replacement ($25.00)'}
             </button>
          </form>
        )}
      </section>
    </div>
  );
}