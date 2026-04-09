'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const US_STATES = [
    { code: 'US-AL', name: 'Alabama' }, { code: 'US-AK', name: 'Alaska' }, { code: 'US-AZ', name: 'Arizona' },
    { code: 'US-AR', name: 'Arkansas' }, { code: 'US-CA', name: 'California' }, { code: 'US-CO', name: 'Colorado' },
    { code: 'US-CT', name: 'Connecticut' }, { code: 'US-DE', name: 'Delaware' }, { code: 'US-FL', name: 'Florida' },
    { code: 'US-GA', name: 'Georgia' }, { code: 'US-HI', name: 'Hawaii' }, { code: 'US-ID', name: 'Idaho' },
    { code: 'US-IL', name: 'Illinois' }, { code: 'US-IN', name: 'Indiana' }, { code: 'US-IA', name: 'Iowa' },
    { code: 'US-KS', name: 'Kansas' }, { code: 'US-KY', name: 'Kentucky' }, { code: 'US-LA', name: 'Louisiana' },
    { code: 'US-ME', name: 'Maine' }, { code: 'US-MD', name: 'Maryland' }, { code: 'US-MA', name: 'Massachusetts' },
    { code: 'US-MI', name: 'Michigan' }, { code: 'US-MN', name: 'Minnesota' }, { code: 'US-MS', name: 'Mississippi' },
    { code: 'US-MO', name: 'Missouri' }, { code: 'US-MT', name: 'Montana' }, { code: 'US-NE', name: 'Nebraska' },
    { code: 'US-NV', name: 'Nevada' }, { code: 'US-NH', name: 'New Hampshire' }, { code: 'US-NJ', name: 'New Jersey' },
    { code: 'US-NM', name: 'New Mexico' }, { code: 'US-NY', name: 'New York' }, { code: 'US-NC', name: 'North Carolina' },
    { code: 'US-ND', name: 'North Dakota' }, { code: 'US-OH', name: 'Ohio' }, { code: 'US-OK', name: 'Oklahoma' },
    { code: 'US-OR', name: 'Oregon' }, { code: 'US-PA', name: 'Pennsylvania' }, { code: 'US-RI', name: 'Rhode Island' },
    { code: 'US-SC', name: 'South Carolina' }, { code: 'US-SD', name: 'South Dakota' }, { code: 'US-TN', name: 'Tennessee' },
    { code: 'US-TX', name: 'Texas' }, { code: 'US-UT', name: 'Utah' }, { code: 'US-VT', name: 'Vermont' },
    { code: 'US-VA', name: 'Virginia' }, { code: 'US-WA', name: 'Washington' }, { code: 'US-WV', name: 'West Virginia' },
    { code: 'US-WI', name: 'Wisconsin' }, { code: 'US-WY', name: 'Wyoming' },
];
const INTL = [
    { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'NZ', name: 'New Zealand' }, { code: 'ZA', name: 'South Africa' }, { code: 'DE', name: 'Germany' },
    { code: 'NL', name: 'Netherlands' }, { code: 'AE', name: 'UAE' }, { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' }, { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
];

export default function ComplianceCardPage() {
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [selected, setSelected] = useState('US-TX');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) return;
        setLoading(true);
        await supabase.from('hc_compliance_card_downloads').insert({
            email, name: name || null, phone: phone || null,
            jurisdiction_code: selected, card_type: 'single_state', source: 'compliance_card_page',
        });
        setSubmitted(true);
        setLoading(false);
    };

    const selectedName = [...US_STATES, ...INTL].find(s => s.code === selected)?.name || selected;

    return (
        <main className="flex-grow max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <header className="mb-12 sm:mb-16 text-center">
                <span className="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full italic">FREE DOWNLOAD</span>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter mt-6">ESCORT <span className="text-[var(--color-accent)] underline decoration-4 underline-offset-4">COMPLIANCE CARD</span></h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-4">One-page reference card with every dimension threshold, escort configuration, required equipment, and authority contact. Always current. Always free.</p>
            </header>

            {!submitted ? (
                <div className="max-w-2xl mx-auto">
                    <div className={`bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 mb-6 ${step !== 1 ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3 mb-6"><span className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-black text-sm">1</span><p className="text-white font-black">Select Your State or Country</p></div>
                        {step === 1 && (
                            <>
                                <div className="mb-4"><p className="text-gray-500 text-[10px] font-black uppercase mb-3">US States</p><div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">{US_STATES.map(s => (<button aria-label="Interactive Button" key={s.code} onClick={() => setSelected(s.code)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selected === s.code ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{s.name}</button>))}</div></div>
                                <div className="mb-4"><p className="text-gray-500 text-[10px] font-black uppercase mb-3">International</p><div className="flex flex-wrap gap-2">{INTL.map(s => (<button aria-label="Interactive Button" key={s.code} onClick={() => setSelected(s.code)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selected === s.code ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{s.name}</button>))}</div></div>
                                <button aria-label="Interactive Button" onClick={() => setStep(2)} className="w-full bg-[#121212] text-white py-3 rounded-xl font-black text-sm hover:bg-[var(--color-accent)] transition-all mt-4">GET {selectedName.toUpperCase()} CARD →</button>
                            </>
                        )}
                    </div>
                    <div className={`bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 ${step !== 2 ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-3 mb-6"><span className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-black text-sm">2</span><p className="text-white font-black">Where Should We Send It?</p></div>
                        {step === 2 && (
                            <div className="space-y-4">
                                <input type="email" placeholder="your@email.com *" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--color-accent)] outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Name (optional)" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--color-accent)] outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="tel" placeholder="Phone (optional)" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--color-accent)] outline-none" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                                <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-4"><p className="text-[var(--color-accent)] font-black text-sm">What you&apos;ll get:</p><ul className="text-gray-400 text-xs mt-2 space-y-1"><li>✓ {selectedName} Escort Compliance Card (PDF)</li><li>✓ All dimension thresholds on one page</li><li>✓ Authority contacts &amp; official links</li><li>✓ Regulation change alerts for {selectedName}</li></ul></div>
                                <button aria-label="Interactive Button" onClick={handleSubmit} disabled={!email || loading} className="w-full bg-[var(--color-accent)] text-white py-4 rounded-xl font-black text-lg hover:bg-[#121212] transition-all disabled:opacity-50">{loading ? 'SENDING...' : `SEND MY FREE ${selectedName.toUpperCase()} CARD`}</button>
                                <p className="text-gray-600 text-[10px] text-center">No spam. Unsubscribe anytime.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 sm:p-12">
                        <div className="text-6xl mb-6">✅</div>
                        <h2 className="text-white font-black text-3xl italic mb-4">Card Sent!</h2>
                        <p className="text-gray-400 text-lg mb-6">Check your email for the {selectedName} Escort Compliance Card.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <a href="/tools/escort-calculator" className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[var(--color-accent)]/50 transition-all text-left"><p className="text-[var(--color-accent)] font-black text-sm">🧮 ROUTE CALCULATOR</p><p className="text-gray-400 text-xs mt-1">Check escorts for your entire route</p></a>
                            <a href="/directory" className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[var(--color-accent)]/50 transition-all text-left"><p className="text-[var(--color-accent)] font-black text-sm">📍 FIND ESCORTS</p><p className="text-gray-400 text-xs mt-1">Browse available operators near you</p></a>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
