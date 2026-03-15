'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MobileList } from '@/components/mobile/MobileComponents';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';

/* ══════════════════════════════════════════════════════════════
   Mobile Provider Profile — Frame 7
   Hero + action row + about + services + service area + reviews + fleet
   Approved spec: 390px, card-based, native app feel
   ══════════════════════════════════════════════════════════════ */

interface ProviderProfileProps {
  provider: {
    id: string;
    name: string;
    location: string;
    trustScore: number;
    rating: number;
    reviewCount: number;
    verified: boolean;
    about: string;
    services: string[];
    serviceStates: string[];
    fleet: number;
    reviews: Array<{
      author: string;
      date: string;
      stars: number;
      text: string;
    }>;
  };
}

/* ── Icons ── */
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill={filled ? 'var(--m-gold)' : 'none'}
    stroke={filled ? 'none' : 'var(--m-text-muted)'}
    strokeWidth={2}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--m-gold)" stroke="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10" stroke="#000" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function TrustScoreCircle({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#22C55E' : score >= 70 ? 'var(--m-gold)' : '#F59E0B';

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--m-border-subtle)" strokeWidth="3"/>
        <circle cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--m-font-h2)', fontWeight: 900, color,
      }}>
        {score}
      </div>
    </div>
  );
}

/* ── Default mock data ── */
const DEFAULT_PROVIDER = {
  id: 'p1',
  name: 'Texas Wide Load Escorts',
  location: 'Houston, TX',
  trustScore: 92,
  rating: 4.8,
  reviewCount: 127,
  verified: true,
  about: 'Texas Wide Load Escorts is a leading oversize load escort company based in Houston. Licensed, insured, and experienced in wide load, super load, and route survey operations across the southern states.',
  services: ['Oversize', 'Super Load', 'Route Survey', 'Height Pole'],
  serviceStates: ['TX', 'OK', 'LA', 'NM'],
  fleet: 3,
  reviews: [
    { author: 'Jonathan Reimer', date: 'Jun 1, 2023', stars: 5, text: 'Very professional team. Great communication throughout the entire escort operation.' },
    { author: 'Mike D.', date: 'May 12, 2023', stars: 5, text: 'Reliable and on time. Would hire again for any heavy haul job.' },
    { author: 'Sarah K.', date: 'Apr 28, 2023', stars: 4, text: 'Good service overall. Slightly late to the pickup but handled everything well after that.' },
  ],
};

export default function MobileProviderProfile({ provider = DEFAULT_PROVIDER }: Partial<ProviderProfileProps>) {
  const router = useRouter();

  return (
    <div className="m-shell-content" style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Header with back button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--m-md)',
        padding: 'var(--m-safe-top) var(--m-screen-pad) 0',
        paddingTop: 'calc(var(--m-safe-top) + var(--m-md))',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', color: 'var(--m-text-primary)',
            padding: 'var(--m-xs)', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <BackIcon />
        </button>
        <span style={{
          fontSize: 'var(--m-font-h1)', fontWeight: 900,
          color: 'var(--m-text-primary)', letterSpacing: '-0.02em',
        }}>
          Profile
        </span>
      </div>

      {/* ── Hero Section ── */}
      <div style={{ padding: 'var(--m-lg) var(--m-screen-pad)' }}>
        <div style={{ display: 'flex', gap: 'var(--m-md)', alignItems: 'center' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--m-radius-full)',
            background: 'var(--m-surface-raised)',
            border: '2px solid var(--m-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 22, fontWeight: 900,
            color: 'var(--m-gold)',
          }}>
            {provider.name.charAt(0)}{provider.name.split(' ')[1]?.charAt(0) || ''}
          </div>

          {/* Name + location */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-xs)' }}>
              <span style={{
                fontSize: 'var(--m-font-h2)', fontWeight: 800,
                color: 'var(--m-text-primary)',
                lineHeight: 1.2,
              }}>
                {provider.name}
              </span>
              {provider.verified && <ShieldIcon />}
            </div>
            <div style={{
              fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
              marginTop: 2, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              📍 {provider.location}
            </div>
          </div>

          {/* Trust score circle */}
          <TrustScoreCircle score={provider.trustScore} />
        </div>
      </div>

      {/* ── Action Row ── */}
      <div style={{
        display: 'flex', gap: 'var(--m-sm)',
        padding: '0 var(--m-screen-pad)', marginBottom: 'var(--m-lg)',
      }}>
        <button className="m-btn m-btn--secondary m-btn--small" style={{
          flex: 1, gap: 6, height: 44,
        }}>
          <PhoneIcon /> Call
        </button>
        <button className="m-btn m-btn--secondary m-btn--small" style={{
          flex: 1, gap: 6, height: 44,
        }}>
          <MessageIcon /> Message
        </button>
        <button className="m-btn m-btn--primary m-btn--small" style={{
          flex: 1.2, height: 44, fontWeight: 800,
        }}>
          Request
        </button>
      </div>

      {/* ── About ── */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginBottom: 'var(--m-lg)' }}>
        <h3 style={{
          fontSize: 'var(--m-font-h3)', fontWeight: 800,
          color: 'var(--m-text-primary)', marginBottom: 'var(--m-sm)',
        }}>About</h3>
        <p style={{
          fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
          lineHeight: 1.6, margin: 0,
        }}>
          {provider.about}
        </p>
      </div>

      {/* ── Services ── */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginBottom: 'var(--m-lg)' }}>
        <h3 style={{
          fontSize: 'var(--m-font-h3)', fontWeight: 800,
          color: 'var(--m-text-primary)', marginBottom: 'var(--m-sm)',
        }}>Services</h3>
        <div style={{ display: 'flex', gap: 'var(--m-xs)', flexWrap: 'wrap' }}>
          {provider.services.map(s => (
            <span key={s} className="m-chip m-chip--tag">{s}</span>
          ))}
        </div>
      </div>

      {/* ── Service Area ── */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginBottom: 'var(--m-lg)' }}>
        <h3 style={{
          fontSize: 'var(--m-font-h3)', fontWeight: 800,
          color: 'var(--m-text-primary)', marginBottom: 'var(--m-sm)',
        }}>Service Area</h3>
        <div className="m-card" style={{ padding: 'var(--m-md)' }}>
          {/* Map placeholder */}
          <div style={{
            height: 120, borderRadius: 'var(--m-radius-md)',
            background: 'linear-gradient(135deg, var(--m-surface) 0%, var(--m-surface-raised) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--m-md)',
            border: '1px solid var(--m-border-subtle)',
          }}>
            <span style={{ fontSize: 36, opacity: 0.3 }}>🗺️</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-sm)' }}>
            <span style={{
              fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-muted)',
              fontWeight: 600,
            }}>States:</span>
            <div style={{ display: 'flex', gap: 'var(--m-xs)', flexWrap: 'wrap' }}>
              {provider.serviceStates.map(st => (
                <span key={st} className="m-chip m-chip--tag m-chip--gold"
                  style={{ fontSize: 'var(--m-font-overline)', padding: '2px 8px' }}>
                  {st}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews ── */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginBottom: 'var(--m-lg)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 'var(--m-md)',
        }}>
          <div>
            <h3 style={{
              fontSize: 'var(--m-font-h3)', fontWeight: 800,
              color: 'var(--m-text-primary)', margin: 0,
            }}>Reviews</h3>
            <span style={{
              fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)',
            }}>{provider.reviewCount} reviews</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 'var(--m-font-h2)', fontWeight: 900,
              color: 'var(--m-text-primary)',
            }}>{provider.rating}</span>
            <StarIcon />
          </div>
        </div>

        <MobileList>
          {provider.reviews.map((review, i) => (
            <div key={i} className="m-card m-animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--m-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-sm)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--m-radius-full)',
                    background: 'var(--m-surface-raised)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--m-text-secondary)',
                  }}>
                    {review.author.charAt(0)}
                  </div>
                  <span style={{
                    fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
                    color: 'var(--m-text-primary)',
                  }}>{review.author}</span>
                </div>
                <span style={{
                  fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)',
                }}>{review.date}</span>
              </div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 'var(--m-sm)' }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <StarIcon key={j} filled={j < review.stars} />
                ))}
              </div>
              <p style={{
                fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
                lineHeight: 1.5, margin: 0,
              }}>{review.text}</p>
            </div>
          ))}
        </MobileList>
      </div>

      {/* ── Fleet ── */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginBottom: 'var(--m-lg)' }}>
        <h3 style={{
          fontSize: 'var(--m-font-h3)', fontWeight: 800,
          color: 'var(--m-text-primary)', marginBottom: 'var(--m-sm)',
        }}>Fleet</h3>
        <div className="m-card" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--m-md)',
          padding: 'var(--m-md)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--m-radius-md)',
            background: 'rgba(212,168,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TruckIcon />
          </div>
          <div>
            <div style={{
              fontSize: 'var(--m-font-body)', fontWeight: 700,
              color: 'var(--m-text-primary)',
            }}>{provider.fleet} vehicles</div>
            <div style={{
              fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)',
            }}>Active fleet</div>
          </div>
        </div>
      </div>

      <div style={{ height: 'var(--m-3xl)' }} />
      <MobileAppNav />
    </div>
  );
}
