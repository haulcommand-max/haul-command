'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, MapPin, Clock, Award, Star, Users, TrendingUp,
  MessageCircle, Zap, Calendar, Wrench, CheckCircle, Heart,
} from 'lucide-react';
import { FollowButton } from '@/components/social/FollowButton';
import { NativeAdCard } from '@/components/ads/NativeAdCard';

/* ═══════════════════════════════════════════════════════════════════
   OperatorProfilePage — Full social profile for operators
   Cover + avatar, bio, stats, endorsements, posts, follow count
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12', bgCard: '#0f1a26', bgSection: '#0a1520',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.13)',
  gold: '#f5b942', green: '#27d17f', blue: '#3ba4ff', purple: '#a78bfa',
  text: '#f0f4f8', muted: '#8fa3b8', subtle: '#556070',
} as const;

interface OperatorProfileProps {
  operatorId: string;
}

interface Profile {
  id: string;
  full_name: string;
  company_name?: string;
  bio?: string;
  city?: string;
  state?: string;
  corridors?: string[];
  equipment?: string[];
  years_experience?: number;
  certifications?: string[];
  total_runs?: number;
  trust_score?: number;
  avg_response_minutes?: number;
  corridor_rank?: number;
  verified?: boolean;
  follower_count?: number;
  following_count?: number;
}

interface Endorsement {
  id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  corridor_slug?: string;
}

// Seed profile
const SEED_PROFILE: Profile = {
  id: 'seed',
  full_name: 'Verified Operator',
  company_name: 'Professional Escort Services',
  bio: 'Licensed pilot car operator specializing in oversize load escorts. Fully insured, height pole equipped, available 24/7 for urgent loads.',
  city: 'Dallas',
  state: 'TX',
  corridors: ['I-10 Gulf Coast', 'I-35 Central Texas', 'I-20 East-West'],
  equipment: ['Height Pole', 'Pilot Car', 'CB Radio', 'LED Warning Signs'],
  years_experience: 8,
  certifications: ['State Licensed', 'DOT Compliant', 'Insured'],
  total_runs: 342,
  trust_score: 87,
  avg_response_minutes: 12,
  corridor_rank: 3,
  verified: true,
  follower_count: 28,
  following_count: 15,
};

function timeSince(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function OperatorProfilePage({ operatorId }: OperatorProfileProps) {
  const [profile, setProfile] = useState<Profile>(SEED_PROFILE);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load profile
      try {
        const res = await fetch(`/api/directory/listings?id=${operatorId}`);
        const data = await res.json();
        if (data.listings?.[0]) {
          const l = data.listings[0];
          setProfile({
            id: l.id,
            full_name: l.name || 'Verified Operator',
            company_name: l.name,
            bio: l.metadata?.bio || SEED_PROFILE.bio,
            city: l.city,
            state: l.region_code,
            corridors: l.metadata?.corridors || SEED_PROFILE.corridors,
            equipment: l.metadata?.equipment || SEED_PROFILE.equipment,
            years_experience: l.metadata?.years_experience || 5,
            certifications: l.metadata?.certifications || SEED_PROFILE.certifications,
            total_runs: l.metadata?.total_runs,
            trust_score: l.rank_score ? Math.round(l.rank_score * 100) : undefined,
            avg_response_minutes: l.metadata?.avg_response_minutes,
            corridor_rank: l.metadata?.corridor_rank,
            verified: l.claim_status === 'claimed' || l.claim_status === 'verified',
            follower_count: l.metadata?.follower_count || 0,
            following_count: l.metadata?.following_count || 0,
          });
        }
      } catch { /* use seed */ }

      // Load endorsements
      try {
        const res = await fetch(`/api/social/endorsements?operator_id=${operatorId}`);
        const data = await res.json();
        setEndorsements(data.endorsements || []);
      } catch { /* empty */ }

      // Load posts
      try {
        const res = await fetch(`/api/social/posts?limit=5`);
        const data = await res.json();
        setPosts(data.posts || []);
      } catch { /* empty */ }

      setLoading(false);
    }
    load();
  }, [operatorId]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Cover Photo */}
      <div style={{
        height: 200, background: 'linear-gradient(135deg, rgba(198,146,58,0.08), rgba(124,58,237,0.04), rgba(59,130,246,0.04))',
        borderBottom: `1px solid ${T.border}`, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(198,146,58,0.1), transparent 60%)',
        }} />
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        {/* Avatar + Name Row */}
        <div style={{ marginTop: -50, display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{
            width: 100, height: 100, borderRadius: 20, background: T.bgCard,
            border: `3px solid ${T.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>🚗</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
                {profile.company_name || profile.full_name}
              </h1>
              {profile.verified && <ShieldCheck size={18} style={{ color: T.green }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              {profile.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.muted }}>
                  <MapPin size={12} /> {profile.city}, {profile.state}
                </span>
              )}
              <span style={{ fontSize: 12, color: T.subtle }}>
                {profile.follower_count || 0} followers · {profile.following_count || 0} following
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <FollowButton operatorId={operatorId} />
            <Link href={`/loads/new?operator=${operatorId}`} className="ag-press" style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #f5b942, #e8a830)',
              color: '#000', fontWeight: 800, fontSize: 13, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Zap size={13} /> Book This Operator
            </Link>
          </div>
        </div>

        {/* Bio */}
        <div className="ag-section-enter" style={{
          background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16,
          padding: '20px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>
            {profile.bio}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {(profile.corridors || []).map(c => (
              <span key={c} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(245,185,66,0.06)', border: '1px solid rgba(245,185,66,0.15)', color: T.gold }}>{c}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {(profile.equipment || []).map(e => (
              <span key={e} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.muted }}>
                <Wrench size={8} style={{ marginRight: 3 }} />{e}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="ag-section-enter" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20,
        }}>
          {[
            { label: 'Total Runs', value: profile.total_runs ?? '—', icon: TrendingUp, color: T.gold },
            { label: 'Trust Score', value: profile.trust_score ?? '—', icon: Star, color: T.green },
            { label: 'Avg Response', value: profile.avg_response_minutes ? `${profile.avg_response_minutes}m` : '—', icon: Clock, color: T.blue },
            { label: 'Corridor Rank', value: profile.corridor_rank ? `#${profile.corridor_rank}` : '—', icon: Award, color: T.purple },
          ].map(stat => (
            <div key={stat.label} style={{
              background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14,
              padding: '16px', textAlign: 'center',
            }}>
              <stat.icon size={16} style={{ color: stat.color, margin: '0 auto 8px' }} />
              <div className="ag-tick" style={{ fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* AdGrid Slot */}
        <div style={{ marginBottom: 20 }}>
          <NativeAdCard surface="operator_profile" placementId="profile-below-stats" variant="inline" />
        </div>

        {/* Endorsements */}
        <div className="ag-section-enter" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={15} style={{ color: T.gold }} /> Broker Endorsements
          </h2>
          {endorsements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {endorsements.map(e => (
                <div key={e.id} style={{
                  background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: '14px', display: 'flex', gap: 12,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,185,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⭐</div>
                  <div>
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>"{e.content}"</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                      — {(e.profiles as any)?.full_name || 'Verified Broker'} · {timeSince(e.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: T.muted }}>No endorsements yet</div>
              <Link href="/login" style={{ fontSize: 12, color: T.gold, textDecoration: 'none', fontWeight: 700, marginTop: 6, display: 'inline-block' }}>
                Sign in to endorse this operator →
              </Link>
            </div>
          )}
        </div>

        {/* Posts Feed */}
        <div className="ag-section-enter" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={15} style={{ color: T.purple }} /> Recent Posts
          </h2>
          {posts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {posts.map(p => (
                <div key={p.id} className="ag-slide-up" style={{
                  background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: '14px',
                }}>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, margin: 0 }}>{p.content}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: T.muted }}>{timeSince(p.created_at)}</span>
                    {p.corridor_slug && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, background: 'rgba(245,185,66,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                        {p.corridor_slug}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>
              No posts yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OperatorProfilePage;
