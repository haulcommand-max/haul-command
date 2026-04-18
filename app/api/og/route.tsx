/**
 * app/api/og/route.tsx
 * Haul Command — Dynamic OpenGraph Image Generator
 *
 * Generates branded OG images for:
 *   - Operators: /api/og?type=operator&name=John+Smith&city=Houston&score=94&role=Pilot+Car
 *   - Corridors: /api/og?type=corridor&origin=Houston&destination=Dallas&rate=4.50
 *   - Regulations: /api/og?type=regulation&jurisdiction=Texas&topic=escort_requirements
 *   - Generic pages: /api/og?title=...&subtitle=...
 *
 * Uses @vercel/og (Edge function).
 * Max duration: 10s. Cached: 24h.
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get('type') ?? 'generic';
  const name = searchParams.get('name') ?? 'Haul Command';
  const city = searchParams.get('city') ?? '';
  const state = searchParams.get('state') ?? '';
  const score = searchParams.get('score') ?? '';
  const role = searchParams.get('role') ?? 'Pilot Car Operator';
  const origin = searchParams.get('origin') ?? '';
  const destination = searchParams.get('destination') ?? '';
  const rate = searchParams.get('rate') ?? '';
  const jurisdiction = searchParams.get('jurisdiction') ?? '';
  const topic = searchParams.get('topic') ?? '';
  const title = searchParams.get('title') ?? 'Haul Command';
  const subtitle = searchParams.get('subtitle') ?? 'The Command Center for Heavy Haul';
  const country = searchParams.get('country') ?? 'US';
  const verified = searchParams.get('verified') === 'true';

  const W = 1200;
  const H = 630;

  // â”€â”€ Shared design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const bg = '#07090d';
  const amber = '#f59e0b';
  const amberDim = '#92400e';
  const gray400 = '#9ca3af';
  const gray600 = '#4b5563';
  const white = '#ffffff';

  const topicLabels: Record<string, string> = {
    escort_requirements: 'Escort Requirements',
    permit_requirements: 'Permit Requirements',
    credential_requirements: 'Credential Requirements',
    route_rules: 'Route Rules',
    night_move_rules: 'Night Move Rules',
    width_limits: 'Width Limits',
    height_limits: 'Height Limits',
    weight_limits: 'Weight Limits',
  };

  // â”€â”€ Build image content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let content;

  if (type === 'operator') {
    const location = [city, state, country].filter(Boolean).join(', ');
    content = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: W,
          height: H,
          background: bg,
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Amber glow top-right */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 400, height: 400,
          background: `radial-gradient(circle, ${amberDim}40, transparent 70%)`,
          borderRadius: '50%',
        }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 40, height: 40, background: amber,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#000',
          }}>HC</div>
          <span style={{ color: gray400, fontSize: 16, fontWeight: 500 }}>Haul Command</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Role badge */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: `${amber}18`, border: `1px solid ${amber}40`,
            borderRadius: 8, padding: '6px 14px', width: 'fit-content', marginBottom: 20,
            fontSize: 13, color: amber, fontWeight: 600, letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {role}
          </div>

          {/* Name */}
          <div style={{ fontSize: 52, fontWeight: 800, color: white, lineHeight: 1.1, marginBottom: 12 }}>
            {name}
          </div>

          {/* Location */}
          {location && (
            <div style={{ fontSize: 24, color: gray400, marginBottom: 32 }}>
              ðŸ“ {location}
            </div>
          )}

          {/* Trust score + verification */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {score && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: score >= '85' ? '#064e3b' : '#1c1917',
                border: `1px solid ${score >= '85' ? '#059669' : gray600}`,
                borderRadius: 12, padding: '12px 20px',
              }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: score >= '85' ? '#34d399' : amber }}>
                  {score}
                </span>
                <span style={{ fontSize: 13, color: score >= '85' ? '#6ee7b7' : gray400 }}>
                  Trust Score
                </span>
              </div>
            )}
            {verified && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#1e3a5f', border: '1px solid #3b82f6',
                borderRadius: 12, padding: '12px 20px',
                fontSize: 13, color: '#93c5fd', fontWeight: 600,
              }}>
                âœ“ Verified Operator
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
          <div style={{ fontSize: 14, color: gray600 }}>haulcommand.com</div>
          <div style={{
            background: amber, color: '#000', fontWeight: 700,
            fontSize: 13, padding: '8px 16px', borderRadius: 8,
          }}>
            View Profile â†’
          </div>
        </div>
      </div>
    );
  } else if (type === 'corridor') {
    content = (
      <div style={{
        display: 'flex', flexDirection: 'column', width: W, height: H,
        background: bg, padding: '60px', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, background: amber, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#000' }}>HC</div>
          <span style={{ color: gray400, fontSize: 16 }}>Haul Command · Corridor Intelligence</span>
        </div>

        <div style={{ fontSize: 18, color: amber, fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Corridor Rate Guide
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: white }}>{origin}</div>
          <div style={{ fontSize: 32, color: amber }}>â†’</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: white }}>{destination}</div>
        </div>

        {rate && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 56, fontWeight: 900, color: amber }}>${rate}</span>
            <span style={{ fontSize: 22, color: gray400 }}>/mile avg</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
          {['Live availability', 'Verified operators', 'Real-time rates'].map((tag) => (
            <div key={tag} style={{
              background: `${white}08`, border: `1px solid ${white}15`,
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, color: gray400,
            }}>{tag}</div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 14, color: gray600 }}>haulcommand.com/rates/corridors</div>
          <div style={{ background: amber, color: '#000', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 8 }}>
            Find Operators â†’
          </div>
        </div>
      </div>
    );
  } else if (type === 'regulation') {
    const topicLabel = topicLabels[topic] ?? topic.replaceAll('_', ' ');
    content = (
      <div style={{
        display: 'flex', flexDirection: 'column', width: W, height: H,
        background: bg, padding: '60px', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, background: amber, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#000' }}>HC</div>
          <span style={{ color: gray400, fontSize: 16 }}>Haul Command · Compliance Intelligence</span>
        </div>

        <div style={{ fontSize: 16, color: amber, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Regulation Guide
        </div>

        <div style={{ fontSize: 50, fontWeight: 800, color: white, lineHeight: 1.15, marginBottom: 20 }}>
          {jurisdiction}
        </div>
        <div style={{ fontSize: 28, color: gray400, marginBottom: 40 }}>
          {topicLabel}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Direct Answer', 'Source Stack', 'Tools & Glossary'].map((f) => (
            <div key={f} style={{
              background: `${amber}10`, border: `1px solid ${amber}30`,
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, color: amber, fontWeight: 500,
            }}>{f}</div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ fontSize: 14, color: gray600 }}>haulcommand.com/regulations</div>
          <div style={{ background: amber, color: '#000', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 8 }}>
            Read the Guide â†’
          </div>
        </div>
      </div>
    );
  } else {
    // Generic
    content = (
      <div style={{
        display: 'flex', flexDirection: 'column', width: W, height: H,
        background: bg, padding: '60px', fontFamily: 'sans-serif', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: amber, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#000' }}>HC</div>
          <span style={{ color: gray400, fontSize: 16 }}>Haul Command</span>
        </div>

        <div>
          <div style={{ fontSize: 58, fontWeight: 900, color: white, lineHeight: 1.1, marginBottom: 20 }}>
            {title}
          </div>
          <div style={{ fontSize: 26, color: gray400 }}>{subtitle}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: gray600 }}>haulcommand.com</div>
          <div style={{ background: amber, color: '#000', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 8 }}>
            Explore â†’
          </div>
        </div>
      </div>
    );
  }

  return new ImageResponse(content, {
    width: W,
    height: H,
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}