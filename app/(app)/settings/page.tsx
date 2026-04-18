'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function SettingsPage() {
    const supabase = supabaseBrowser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState({
        display_name: '',
        phone: '',
        email: '',
        crypto_enabled: false,
        preferred_crypto: 'usdt',
        crypto_wallet_address: '',
        push_enabled: true,
        sms_enabled: false,
        email_notifications: true,
        load_alerts: true,
        weekly_digest: true,
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) { window.location.href = '/login'; return; }
        setUser(u);

        const { data } = await supabase.from('operators')
            .select('display_name, phone, email, crypto_enabled, preferred_crypto, crypto_wallet_address')
            .eq('user_id', u.id).single();

        if (data) {
            setProfile(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await supabase.from('operators').update({
            crypto_enabled: profile.crypto_enabled,
            preferred_crypto: profile.preferred_crypto,
            crypto_wallet_address: profile.crypto_wallet_address,
        }).eq('user_id', user.id);

        setSaving(false);
        if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    };

    const CRYPTOS = [
        { code: 'usdt', name: 'Tether (USDT)' },
        { code: 'btc', name: 'Bitcoin (BTC)' },
        { code: 'eth', name: 'Ethereum (ETH)' },
        { code: 'usdc', name: 'USD Coin (USDC)' },
        { code: 'sol', name: 'Solana (SOL)' },
        { code: 'ltc', name: 'Litecoin (LTC)' },
    ];

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#030712', color: '#6B7280' }}>Loading settings...</div>;

    const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px', marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#F9FAFB', margin: '0 0 16px' }}>
                <span>{icon}</span> {title}
            </h3>
            {children}
        </div>
    );

    const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 14, color: '#D1D5DB' }}>{label}</span>
            <button aria-label="Interactive Button" onClick={() => onChange(!value)} style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                background: value ? '#F59E0B' : 'rgba(255,255,255,0.12)', transition: 'all 0.2s',
            }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.15s' }} />
            </button>
        </div>
    );

    const Input = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
        <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
                width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                color: '#F9FAFB', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }} />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#030712', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", color: '#E5E7EB' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 6 }}>HAUL COMMAND</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F9FAFB', margin: 0 }}>Settings</h1>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{user?.email}</p>
                </div>

                <Section title="Profile" icon="ðŸ‘¤">
                    <Input label="Display Name" value={profile.display_name} onChange={(v: string) => setProfile(p => ({ ...p, display_name: v }))} placeholder="Your name or company" />
                    <Input label="Phone" value={profile.phone} onChange={(v: string) => setProfile(p => ({ ...p, phone: v }))} placeholder="+1 555 123 4567" />
                    <Input label="Email" value={profile.email} onChange={(v: string) => setProfile(p => ({ ...p, email: v }))} type="email" placeholder="you@example.com" />
                </Section>

                <Section title="Crypto Payments" icon="â‚¿">
                    <Toggle label="Enable crypto payments" value={profile.crypto_enabled} onChange={v => setProfile(p => ({ ...p, crypto_enabled: v }))} />
                    {profile.crypto_enabled && (
                        <>
                            <div style={{ marginBottom: 12, marginTop: 8 }}>
                                <label style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Currency</label>
                                <select value={profile.preferred_crypto} onChange={e => setProfile(p => ({ ...p, preferred_crypto: e.target.value }))} style={{
                                    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                                    color: '#F9FAFB', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                                }}>
                                    {CRYPTOS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                </select>
                            </div>
                            <Input label="Wallet Address" value={profile.crypto_wallet_address} onChange={(v: string) => setProfile(p => ({ ...p, crypto_wallet_address: v }))} placeholder="Your wallet address for receiving payments" />
                            <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>Payments will be sent to this address after job completion.</p>
                        </>
                    )}
                </Section>

                <Section title="Notifications" icon="ðŸ””">
                    <Toggle label="Push notifications" value={profile.push_enabled} onChange={v => setProfile(p => ({ ...p, push_enabled: v }))} />
                    <Toggle label="SMS alerts" value={profile.sms_enabled} onChange={v => setProfile(p => ({ ...p, sms_enabled: v }))} />
                    <Toggle label="Email notifications" value={profile.email_notifications} onChange={v => setProfile(p => ({ ...p, email_notifications: v }))} />
                    <Toggle label="New load alerts" value={profile.load_alerts} onChange={v => setProfile(p => ({ ...p, load_alerts: v }))} />
                    <Toggle label="Weekly digest" value={profile.weekly_digest} onChange={v => setProfile(p => ({ ...p, weekly_digest: v }))} />
                </Section>

                <button aria-label="Interactive Button" onClick={handleSave} disabled={saving} style={{
                    width: '100%', padding: '14px', background: saved ? '#10B981' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                    border: 'none', borderRadius: 12, color: saved ? '#fff' : '#030712', fontWeight: 700, fontSize: 15,
                    cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.6 : 1,
                }}>
                    {saving ? 'Saving...' : saved ? 'âœ“ Saved' : 'Save Settings'}
                </button>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button aria-label="Interactive Button" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{
                        background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                        padding: '10px 20px', color: '#EF4444', fontSize: 13, cursor: 'pointer',
                    }}>Sign Out</button>
                </div>
            </div>
        </div>
    );
}