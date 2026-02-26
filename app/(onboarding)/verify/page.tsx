"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { registerPush } from "@/lib/push";
import { BackButton } from "../components/BackButton";
import { ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils/cn";

function VerifyPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eq = searchParams.get("eq");
    const regions = searchParams.get("regions");
    const phone = searchParams.get("phone");

    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = supabaseBrowser();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone: phone || "",
                token: token,
                type: 'sms',
            });

            if (error) throw error;

            // If success, update profile with tags
            if (data.user) {
                // Register device for push notifications (FCM or WebPush)
                registerPush(data.user.id).catch(err => console.error("Push registration error", err));

                // Update profile logic would go here
                // const { error: updatesError } = await supabase.from('profiles').update({ ... }).eq('id', data.user.id)
                // For now, we assume simple auth and redirect.
                // We can do the profile update in a useEffect or a server action later to be secure.
            }

            // Redirect to success/invite page — highest-conversion moment for escort invites
            router.push("/success");
        } catch (err: any) {
            setError(err.message || "Invalid code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BackButton />

            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mx-auto mb-4 animate-pulse">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-2">
                    Verify Code
                </h1>
                <p className="text-brand-muted text-sm">
                    Enter the 6-digit code sent to {phone}
                </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider ml-1">
                    Verification Code
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full text-center tracking-[1em] text-2xl font-mono bg-brand-charcoal border border-brand-steel rounded-xl py-4 text-brand-text placeholder:text-brand-muted/20 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all"
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
                    disabled={loading || token.length < 6}
                    className="w-full py-4 mt-4 bg-brand-gold text-brand-dark font-bold text-lg rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Verify & Enter"}
                </button>
            </form>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-gray-500" /></div>}>
            <VerifyPageInner />
        </Suspense>
    );
}
