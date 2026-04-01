'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ReferralShareCard } from '@/components/psychology/GrowthHooks';

const supabase = createClient();

export default function ReferralPage() {
    const [code, setCode] = useState('');
    const [stats, setStats] = useState({ total_earned: 0, referrals: 0 });
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setLoading(false); return; }

            // Fetch existing referral code
            const { data: codes } = await supabase
                .from('hc_referral_codes')
                .select('*')
                .eq('owner_profile_id', session.user.id)
                .eq('is_active', true)
                .limit(1);

            if (codes && codes.length > 0) {
                setCode(codes[0].code);
                setStats({ total_earned: codes[0].total_earned_usd, referrals: codes[0].uses_count });
            }

            // Fetch referral events
            const { data: evts } = await supabase
                .from('hc_referral_events')
                .select('*')
                .eq('referrer_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (evts) setEvents(evts);
            setLoading(false);
        }
        load();
    }, []);

    const generateCode = async () => {
        setGenerating(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setGenerating(false); return; }

        const { data } = await supabase.rpc('hc_generate_referral_code', { p_profile_id: session.user.id });
        if (data) {
            setCode(data);
        }
        setGenerating(false);
    };

    const statusEmoji: Record<string, string> = {
        signed_up: '📝', activated: '✅', first_job_completed: '💰', reward_paid: '🎉', fraud_blocked: '🚫',
    };

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5 }}>Refer & Earn</h1>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
                    Share Haul Command with other drivers. Earn $25 when they complete their first job.
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
                </div>
            ) : !code ? (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(241,169,27,0.04)', border: '1px dashed rgba(241,169,27,0.2)', borderRadius: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>Get Your Referral Link</h2>
                    <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
                        Generate your unique referral code. Share it in Facebook groups, text it to fellow drivers, or post it on social media.
                    </p>
                    <button onClick={generateCode} disabled={generating} style={{
                        padding: '12px 32px', borderRadius: 12, border: 'none',
                        background: generating ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#F1A91B,#d97706)',
                        color: generating ? '#6b7280' : '#000', fontSize: 14, fontWeight: 800, cursor: generating ? 'wait' : 'pointer',
                    }}>
                        {generating ? '⏳ Generating...' : '🔗 Generate My Code'}
                    </button>
                </div>
            ) : (
                <>
                    <ReferralShareCard code={code} earned={stats.total_earned} referrals={stats.referrals} />

                    {/* How it works */}
                    <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1 }}>How It Works</h3>
                        {[
                            { step: '1', label: 'Share your link', desc: 'Post in pilot car Facebook groups, text it, or share on social media' },
                            { step: '2', label: 'They sign up & activate', desc: 'Your referral creates an account and toggles available' },
                            { step: '3', label: 'They complete first job', desc: 'Once verified completion, you both get $25' },
                        ].map(item => (
                            <div key={item.step} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: item.step !== '3' ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#F1A91B', flexShrink: 0 }}>{item.step}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>{item.label}</div>
                                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Referral History */}
                    {events.length > 0 && (
                        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem' }}>
                            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1 }}>Referral History</h3>
                            {events.map(ev => (
                                <div key={ev.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{statusEmoji[ev.status] ?? '·'}</span>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#d1d5db', fontWeight: 600 }}>{ev.referred_role} referral</div>
                                            <div style={{ fontSize: 10, color: '#4b5563' }}>{new Date(ev.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: ev.reward_paid ? '#10b981' : '#6b7280' }}>
                                            {ev.reward_paid ? `+$${ev.reward_amount_usd}` : ev.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
