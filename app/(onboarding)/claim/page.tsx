"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { BackButton } from "../components/BackButton";
import { Lock, Phone, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils/cn";

function ClaimPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eq = searchParams.get("eq");
    const regions = searchParams.get("regions");

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = supabaseBrowser();

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (phone.length < 10) {
            setError("Please enter a valid phone number");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });

            if (error) throw error;

            router.push(`/verify?eq=${eq}&regions=${regions}&phone=${encodeURIComponent(phone)}`);
        } catch (err: any) {
            setError(err.message || "Failed to send code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BackButton />

            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold mx-auto mb-4 animate-pulse">
                    <Lock size={32} />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-2">
                    Unlock 5+ Loads
                </h1>
                <p className="text-brand-muted text-sm">
                    Strictly for professional operators. Enter your mobile number to verify access.
                </p>
            </div>

            <form onSubmit={handleClaim} className="flex flex-col gap-4">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider ml-1">
                    Mobile Number
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted">
                        <Phone size={18} />
                    </div>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-brand-charcoal border border-brand-steel rounded-xl py-4 pl-12 pr-4 text-brand-text placeholder:text-brand-muted/50 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all"
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-4 bg-brand-gold text-brand-dark font-bold text-lg rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Send Code"}
                </button>

                <p className="text-center text-[10px] text-brand-muted/50 mt-4">
                    By continuing you agree to receive SMS for verification. Msg rates may apply.
                </p>
            </form>
        </div>
    );
}

export default function ClaimPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-gray-400" /></div>}>
            <ClaimPageInner />
        </Suspense>
    );
}
