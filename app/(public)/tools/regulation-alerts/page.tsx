'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Alert { id: string; jurisdiction_code: string; alert_type: string; title: string; description: string; old_value: string; new_value: string; effective_date: string; published_at: string; }

const JURISDICTIONS = ['US-TX', 'US-FL', 'US-CA', 'US-WA', 'US-GA', 'US-IL', 'US-NY', 'US-PA', 'US-OH', 'US-NC', 'AU', 'CA-ON', 'CA-AB', 'CA-BC', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR', 'FR', 'ES', 'IT'];
const alertTypeIcon: Record<string, string> = { threshold_change: 'ðŸ“', new_requirement: 'ðŸ†•', removed_requirement: 'ðŸ—‘ï¸', authority_update: 'ðŸ›ï¸', seasonal_restriction: 'ðŸŽ„', curfew_change: 'â°' };

export default function RegulationAlertsPage() {
    const supabase = createClient();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [email, setEmail] = useState('');
    const [subJurisdictions, setSubJurisdictions] = useState<string[]>([]);
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => { supabase.from('hc_regulation_alerts').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(20).then(({ data }) => setAlerts(data || [])); }, []);

    const handleSubscribe = async () => { if (!email) return; await supabase.from('hc_alert_subscriptions').insert({ email, subscription_type: subJurisdictions.length ? 'jurisdiction' : 'all', subscribed_jurisdictions: subJurisdictions.length ? subJurisdictions : null, source: 'alerts_page' }); setSubscribed(true); };
    const toggleJ = (j: string) => setSubJurisdictions(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);

    return (
        <main className="flex-grow max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <header className="mb-12 sm:mb-16">
                <div className="flex items-center space-x-4 mb-4"><span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded italic">LIVE ALERTS</span><span className="bg-[var(--color-accent)] text-white text-[10px] font-black px-2 py-0.5 rounded italic">FREE</span></div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter">REGULATION <span className="text-[var(--color-accent)] underline decoration-4 underline-offset-4">CHANGE ALERTS</span></h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-3xl mt-4">Get notified instantly when escort requirements change in your operating states. Never get caught by a surprise regulation update again.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
                <div className="lg:col-span-5">
                    {!subscribed ? (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 sticky top-8">
                            <h2 className="text-white font-black text-xl mb-6">ðŸ”” Subscribe to Alerts</h2>
                            <div className="space-y-4">
                                <input type="email" placeholder="your@email.com" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--color-accent)] outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                                <div><p className="text-gray-500 text-[10px] font-black uppercase mb-3">Select jurisdictions (or leave blank for all)</p><div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">{JURISDICTIONS.map(j => (<button aria-label="Interactive Button" key={j} onClick={() => toggleJ(j)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${subJurisdictions.includes(j) ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{j}</button>))}</div></div>
                                <button aria-label="Interactive Button" onClick={handleSubscribe} disabled={!email} className="w-full bg-[var(--color-accent)] text-white py-4 rounded-xl font-black text-sm hover:bg-[#121212] transition-all disabled:opacity-50">SUBSCRIBE — FREE</button>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                <p className="text-gray-500 text-[10px] font-black uppercase">What you&apos;ll get:</p>
                                <div className="space-y-2 text-xs text-gray-400"><p>ðŸ“ Threshold changes</p><p>ðŸ†• New requirements</p><p>ðŸ›ï¸ Authority updates</p><p>ðŸŽ„ Seasonal restrictions</p><p>â° Travel time changes</p></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center"><div className="text-5xl mb-4">ðŸ””</div><h2 className="text-white font-black text-2xl">Subscribed!</h2><p className="text-gray-400 mt-2">You&apos;ll get alerts for {subJurisdictions.length ? subJurisdictions.join(', ') : 'all jurisdictions'}.</p></div>
                    )}
                </div>
                <div className="lg:col-span-7">
                    <h2 className="text-white font-black text-xl mb-6">Recent Regulation Changes</h2>
                    {alerts.length === 0 ? (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-8 sm:p-12 text-center">
                            <p className="text-gray-500 text-xl mb-2">No alerts yet</p>
                            <p className="text-gray-600 text-sm">Subscribe to be first to know when regulations change.</p>
                            <div className="mt-8 space-y-3"><p className="text-gray-500 text-[10px] font-black uppercase mb-4">Example Alerts</p>
                                {[{ type: 'threshold_change', title: 'Texas Width Threshold Changed', desc: '2-escort requirement lowered from 14ft to 13.5ft width', date: 'Mar 2026' }, { type: 'new_requirement', title: 'Florida Affidavit Now Required', desc: 'Loads 15ft+ must include route clearance affidavit', date: 'Feb 2026' }, { type: 'seasonal_restriction', title: 'Holiday Curfew: Memorial Day 2026', desc: '23 states restricting oversize movement May 23-26', date: 'May 2026' }].map((ex, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-left"><div className="flex items-center gap-2 mb-1"><span>{alertTypeIcon[ex.type]}</span><p className="text-white font-bold text-sm">{ex.title}</p></div><p className="text-gray-500 text-xs">{ex.desc}</p><p className="text-gray-600 text-[10px] mt-1">{ex.date}</p></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">{alerts.map(a => (
                            <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2"><span className="text-xl">{alertTypeIcon[a.alert_type] || 'ðŸ“¢'}</span><div><p className="text-white font-black text-sm">{a.title}</p><p className="text-gray-500 text-[10px]">{a.jurisdiction_code} "¢ {a.alert_type.replace(/_/g, ' ')}</p></div></div>
                                <p className="text-gray-400 text-sm mt-2">{a.description}</p>
                                {a.old_value && a.new_value && <div className="flex gap-4 mt-3"><span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs">Was: {a.old_value}</span><span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs">Now: {a.new_value}</span></div>}
                            </div>
                        ))}</div>
                    )}
                </div>
            </div>
        </main>
    );
}