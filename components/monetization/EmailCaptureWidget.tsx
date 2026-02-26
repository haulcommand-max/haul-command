"use client";

import React, { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EmailCaptureWidgetProps {
    headline?: string;
    subheadline?: string;
    geoInterest?: string;
    context?: 'city' | 'corridor' | 'tool';
}

export default function EmailCaptureWidget({
    headline = "Get notified when loads hit this area",
    subheadline = "Join the top 10% of elite pilots getting first-dibs on high-rate loads.",
    geoInterest,
    context = 'city'
}: EmailCaptureWidgetProps) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            // Simplified capture to a leads table (assuming it exists or will be created)
            const { error } = await supabase.from('email_captures').insert({
                email,
                context,
                geo_interest: geoInterest,
                source_url: typeof window !== 'undefined' ? window.location.pathname : null
            });

            if (error) throw error;
            setStatus('success');
            setEmail("");
        } catch (err: any) {
            console.error("Capture error:", err);
            setErrorMsg(err.message || 'Failed to subscribe. Please try again.');
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-[#1a1c14] border border-[#2c3d1b] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 relative overflow-hidden my-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.1)_0,transparent_100%)]"></div>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 relative z-10" />
                <h3 className="text-xl font-bold text-white relative z-10">Command Confirmed</h3>
                <p className="text-emerald-400/80 text-sm relative z-10">You're now on the priority dispatch list for {geoInterest || 'this area'}.</p>
            </div>
        );
    }

    return (
        <div className="bg-hc-panel border border-hc-industrial-charcoal rounded-xl p-6 sm:p-8 relative overflow-hidden my-8 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-hc-primary-gold/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 justify-between">
                <div className="max-w-xl text-center lg:text-left">
                    <h3 className="text-2xl font-bold text-hc-text mb-2 tracking-tight">
                        {headline}
                    </h3>
                    <p className="text-hc-muted text-sm sm:text-base">
                        {subheadline}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 sm:w-72">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-hc-muted" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="pilot@example.com"
                            className="w-full pl-10 pr-4 py-3 bg-hc-bg border border-hc-industrial-charcoal rounded-lg text-hc-text placeholder:text-hc-subtle focus:outline-none focus:border-hc-primary-gold focus:ring-1 focus:ring-hc-primary-gold transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="px-6 py-3 bg-hc-primary-gold text-hc-command-black font-bold rounded-lg hover:bg-hc-gold-400 transition-all shadow-[0_0_20px_rgba(198,146,58,0.2)] hover:shadow-[0_0_25px_rgba(198,146,58,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {status === 'loading' ? 'Securing...' : 'Subscribe'}
                        {!status && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>
            </div>
            {status === 'error' && (
                <p className="text-hc-red-500 text-sm mt-4 text-center lg:text-right relative z-10">{errorMsg}</p>
            )}
        </div>
    );
}
