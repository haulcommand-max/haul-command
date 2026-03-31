"use client";

import React, { useState } from "react";
import { ShieldCheck, Phone, Globe, Mail, ArrowRight, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

/**
 * Claim This Place CTA
 * Shown on unclaimed place profile pages. Handles the full verification flow inline.
 */

interface ClaimThisPlaceProps {
    placeId: string;
    placeName: string;
    placePhone?: string | null;
    placeWebsite?: string | null;
    claimantAccountId?: string;
}

type Step = 'cta' | 'method' | 'otp' | 'dns' | 'html' | 'email' | 'success';

export default function ClaimThisPlace({
    placeId,
    placeName,
    placePhone,
    placeWebsite,
    claimantAccountId,
}: ClaimThisPlaceProps) {
    const [step, setStep] = useState<Step>('cta');
    const [loading, setLoading] = useState(false);
    const [claimId, setClaimId] = useState<string | null>(null);
    const [otpTarget, setOtpTarget] = useState('');
    const [dnsRecord, setDnsRecord] = useState('');
    const [htmlTag, setHtmlTag] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [error, setError] = useState('');

    const startClaim = async (method: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/places/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    placeId,
                    claimantAccountId,
                    verificationMethod: method,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setClaimId(data.claimId);
                if (method === 'phone_otp') {
                    setOtpTarget(data.otpSentTo || '');
                    setStep('otp');
                } else if (method === 'website_dns') {
                    setDnsRecord(data.dnsRecord || '');
                    setStep('dns');
                } else if (method === 'website_html_tag') {
                    setHtmlTag(data.htmlTag || '');
                    setStep('html');
                } else {
                    setStep('email');
                }
            } else {
                setError(data.error || 'Failed to start claim');
            }
        } catch {
            setError('Network error');
        }
        setLoading(false);
    };

    const verify = async (params: Record<string, unknown>) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/places/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', claimId, ...params }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('success');
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch {
            setError('Network error');
        }
        setLoading(false);
    };

    // ── CTA (initial state) ──
    if (step === 'cta') {
        return (
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 rounded-xl p-3 shrink-0">
                        <ShieldCheck className="text-amber-400" size={28} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">Is this your business?</h3>
                        <p className="text-sm text-zinc-400 mb-4">
                            Claim <strong className="text-zinc-200">{placeName}</strong> to update your info, respond to reviews, and unlock premium features.
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-4">
                            <span className="flex items-center gap-1"><CheckCircle2 className="text-emerald-500" size={14} /> Edit hours & contact</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="text-emerald-500" size={14} /> Verified badge</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="text-emerald-500" size={14} /> Lead capture</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="text-emerald-500" size={14} /> Analytics</span>
                        </div>
                        <button aria-label="Interactive Button"
                            onClick={() => claimantAccountId ? setStep('method') : window.location.assign('/login?redirect=claim&place=' + placeId)}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-colors"
                        >
                            Claim This Place <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Method selection ──
    if (step === 'method') {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Verify Your Ownership</h3>
                <p className="text-sm text-zinc-400 mb-6">Choose how youd like to prove you own <strong className="text-zinc-200">{placeName}</strong>:</p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <div className="space-y-3">
                    {placePhone && (
                        <button aria-label="Interactive Button" disabled={loading} onClick={() => startClaim('phone_otp')} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 text-left flex items-center gap-4 transition-colors disabled:opacity-50">
                            <Phone className="text-emerald-400 shrink-0" size={22} />
                            <div>
                                <p className="font-semibold text-white">Phone Verification (Fastest)</p>
                                <p className="text-xs text-zinc-500">We'll send a code to the business phone on file</p>
                            </div>
                        </button>
                    )}
                    {placeWebsite && (
                        <>
                            <button aria-label="Interactive Button" disabled={loading} onClick={() => startClaim('website_dns')} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 text-left flex items-center gap-4 transition-colors disabled:opacity-50">
                                <Globe className="text-blue-400 shrink-0" size={22} />
                                <div>
                                    <p className="font-semibold text-white">DNS Verification</p>
                                    <p className="text-xs text-zinc-500">Add a TXT record to your domain's DNS</p>
                                </div>
                            </button>
                            <button aria-label="Interactive Button" disabled={loading} onClick={() => startClaim('website_html_tag')} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 text-left flex items-center gap-4 transition-colors disabled:opacity-50">
                                <ExternalLink className="text-purple-400 shrink-0" size={22} />
                                <div>
                                    <p className="font-semibold text-white">HTML Tag Verification</p>
                                    <p className="text-xs text-zinc-500">Add a meta tag to your website homepage</p>
                                </div>
                            </button>
                        </>
                    )}
                    <button aria-label="Interactive Button" disabled={loading} onClick={() => startClaim('email_domain_match')} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 text-left flex items-center gap-4 transition-colors disabled:opacity-50">
                        <Mail className="text-orange-400 shrink-0" size={22} />
                        <div>
                            <p className="font-semibold text-white">Email Verification</p>
                            <p className="text-xs text-zinc-500">Verify using your business email domain</p>
                        </div>
                    </button>
                </div>
                {loading && <div className="flex items-center gap-2 mt-4 text-zinc-400"><Loader2 className="animate-spin" size={16} /> Starting verification...</div>}
            </div>
        );
    }

    // ── OTP entry ──
    if (step === 'otp') {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Enter Verification Code</h3>
                <p className="text-sm text-zinc-400 mb-6">We sent a 6-digit code to <strong className="text-zinc-200">{otpTarget}</strong></p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-2xl text-center font-mono tracking-[0.5em] text-white mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button aria-label="Interactive Button"
                    disabled={loading || otpInput.length !== 6}
                    onClick={() => verify({ otpCode: otpInput })}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    Verify Code
                </button>
            </div>
        );
    }

    // ── DNS instructions ──
    if (step === 'dns') {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">DNS Verification</h3>
                <p className="text-sm text-zinc-400 mb-4">Add this TXT record to your domain's DNS settings:</p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <code className="block bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-emerald-400 font-mono mb-6 break-all">{dnsRecord}</code>
                <button aria-label="Interactive Button"
                    disabled={loading}
                    onClick={() => verify({ dnsVerified: true })}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    I've Added the Record — Verify Now
                </button>
            </div>
        );
    }

    // ── HTML tag instructions ──
    if (step === 'html') {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">HTML Tag Verification</h3>
                <p className="text-sm text-zinc-400 mb-4">Add this meta tag to the <code className="text-zinc-300">&lt;head&gt;</code> of your homepage:</p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <code className="block bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-purple-400 font-mono mb-6 break-all">{htmlTag}</code>
                <button aria-label="Interactive Button"
                    disabled={loading}
                    onClick={() => verify({ htmlTagVerified: true })}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    I've Added the Tag — Verify Now
                </button>
            </div>
        );
    }

    // ── Email ──
    if (step === 'email') {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Check Your Email</h3>
                <p className="text-sm text-zinc-400 mb-4">We've sent a verification link to your business email.</p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <p className="text-zinc-500 text-sm">Click the link in the email to complete verification. This page will update automatically.</p>
            </div>
        );
    }

    // ── Success ──
    return (
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 rounded-xl p-3">
                    <CheckCircle2 className="text-emerald-400" size={28} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">You're Verified!</h3>
                    <p className="text-sm text-zinc-400">
                        <strong className="text-zinc-200">{placeName}</strong> is now claimed and verified.
                        You can edit your profile, respond to reviews, and upgrade to premium features.
                    </p>
                </div>
            </div>
        </div>
    );
}
