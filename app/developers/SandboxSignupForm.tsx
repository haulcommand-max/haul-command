'use client';

import { useState } from 'react';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SandboxSignupForm
//
// Email capture form for the free API sandbox key.
// On submit: POST /api/developers/sandbox-key
// Success: show confirmation + expected delivery time.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function SandboxSignupForm() {
    const [email, setEmail] = useState('');
    const [useCase, setUseCase] = useState('');
    const [company, setCompany] = useState('');
    const [state, setState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email.trim()) return;

        setState('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/developers/sandbox-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), use_case: useCase.trim(), company: company.trim() }),
            });

            if (res.ok) {
                setState('success');
            } else {
                const json = await res.json().catch(() => ({}));
                setErrorMsg(json?.error || 'Something went wrong. Please try again.');
                setState('error');
            }
        } catch {
            setErrorMsg('Network error. Please check your connection and try again.');
            setState('error');
        }
    };

    if (state === 'success') {
        return (
            <div className="text-center py-6 space-y-3 animate-in fade-in duration-300">
                <div className="mx-auto w-14 h-14 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-blue-400 text-2xl">ðŸ“¬</span>
                </div>
                <h3 className="font-bold text-white text-lg">Check your inbox</h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Your sandbox API key will arrive within <span className="text-white font-semibold">5 minutes</span>.
                    Check your spam folder if it doesn't appear.
                </p>
                <div className="mt-4 bg-white/5 rounded-xl p-4 text-left text-xs text-gray-400 space-y-1.5 font-mono">
                    <div className="text-gray-500"># Your key will look like:</div>
                    <div className="text-blue-400">Authorization: Bearer hc_sandbox_xxxxxxxx</div>
                    <div className="text-gray-500"># Rate limit: 100 calls/day</div>
                    <div className="text-gray-500"># Base URL: https://api.haulcommand.com/v1</div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
                <label htmlFor="dev-email" className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Work email <span className="text-red-400">*</span>
                </label>
                <input
                    id="dev-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                />
            </div>

            {/* Company (optional) */}
            <div>
                <label htmlFor="dev-company" className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Company or project name <span className="text-gray-600">(optional)</span>
                </label>
                <input
                    id="dev-company"
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Acme Logistics"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
            </div>

            {/* Use case (optional, helps qualify) */}
            <div>
                <label htmlFor="dev-usecase" className="block text-xs font-semibold text-gray-300 mb-1.5">
                    What are you building? <span className="text-gray-600">(optional)</span>
                </label>
                <select
                    id="dev-usecase"
                    value={useCase}
                    onChange={e => setUseCase(e.target.value)}
                    className="w-full bg-[#1a1c20] border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                >
                    <option value="">Select a use case...</option>
                    <option value="tms_integration">TMS / dispatch system integration</option>
                    <option value="load_board">Load board or marketplace</option>
                    <option value="fleet_management">Fleet management platform</option>
                    <option value="insurance">Insurance underwriting / risk</option>
                    <option value="analytics">Analytics / business intelligence</option>
                    <option value="mobile_app">Mobile app for operators</option>
                    <option value="research">Research / data analysis</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Error */}
            {state === 'error' && errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-4 py-3">
                    {errorMsg}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={state === 'loading' || !email.trim()}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {state === 'loading' ? 'Sending...' : 'Get Free Sandbox Key â†’'}
            </button>

            <p className="text-center text-xs text-gray-600">
                No credit card. No spam. Unsubscribe anytime.
            </p>

            {/* Quick reference */}
            <div className="border-t border-white/5 pt-4 space-y-1.5">
                <p className="text-xs text-gray-500 font-semibold">What you get immediately:</p>
                {[
                    '100 API calls/day, forever free',
                    'Operators search (GET /v1/operators/search)',
                    'Glossary definitions (GET /v1/glossary/:slug)',
                    'JSON docs + Postman collection',
                ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-blue-400">âœ“</span>
                        {f}
                    </div>
                ))}
            </div>
        </form>
    );
}