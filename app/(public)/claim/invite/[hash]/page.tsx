import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Zap, Clock, ArrowRight, Users } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "You've Been Invited — Join Haul Command | Haul Command",
    description: "A verified escort operator invited you to Haul Command. Post loads, find escorts, and cut your booking time in half.",
};

interface Props {
    params: Promise<{ hash: string }>;
}

export default async function BrokerInvitePage({ params }: Props) {
    const { hash } = await params;
    const supabase = await createClient();

    // Look up the invite link
    const { data: invite, error } = await supabase
        .from("escort_invite_links")
        .select(`
      id,
      token,
      escort_id,
      broker_phone,
      broker_email,
      click_count,
      converted_at,
      expires_at,
      profiles:escort_id (
        full_name,
        city,
        state,
        profile_strength
      )
    `)
        .eq("token", hash)
        .single();

    // Mark click
    if (invite && !error) {
        await supabase
            .from("escort_invite_links")
            .update({
                click_count: (invite.click_count ?? 0) + 1,
                last_clicked_at: new Date().toISOString(),
            })
            .eq("id", invite.id);
    }

    // Already converted — show success
    if (invite?.converted_at) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Already Connected</h1>
                <p className="text-slate-400 mb-8 max-w-sm">This invite has already been used. You&apos;re all set.</p>
                <Link href="/directory" className="px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors">
                    Browse Escorts →
                </Link>
            </div>
        );
    }

    // Expired
    const isExpired = invite?.expires_at && new Date(invite.expires_at) < new Date();
    if (!invite || error || isExpired) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-5xl mb-6">🔗</div>
                <h1 className="text-2xl font-black text-white mb-2">Link Expired</h1>
                <p className="text-slate-400 mb-8 max-w-sm">This invite link is no longer valid. Ask your escort contact to send a new one, or browse the directory directly.</p>
                <Link href="/directory" className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
                    Browse Directory →
                </Link>
            </div>
        );
    }

    const escortProfile = Array.isArray(invite.profiles) ? invite.profiles[0] : invite.profiles;
    const escortName = escortProfile?.full_name ?? "A Verified Escort Operator";
    const escortCity = escortProfile?.city ?? "your area";
    const escortState = escortProfile?.state ?? "";

    // Pre-fill: if phone/email in invite, pass to onboarding
    const signupParams = new URLSearchParams();
    if (invite.broker_phone) signupParams.set("phone", invite.broker_phone);
    if (invite.broker_email) signupParams.set("email", invite.broker_email);
    signupParams.set("invite_token", hash);
    signupParams.set("role", "broker");

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Ambient bg */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-lg mx-auto px-4 py-20">

                {/* Escort "sent by" badge */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black text-amber-400">
                        {escortName.charAt(0)}
                    </div>
                    <div className="text-sm text-slate-400">
                        <span className="text-white font-semibold">{escortName}</span>
                        {escortCity ? <> · {escortCity}{escortState ? `, ${escortState}` : ""}</> : null}
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                {/* Hero */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Direct Invite</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-4">
                        Find Verified Escorts<br />
                        <span className="text-amber-400">Without the Guesswork</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
                        {escortName} uses Haul Command to match with brokers like you — verified availability, compliance on file, faster booking.
                    </p>
                </div>

                {/* Value props */}
                <div className="space-y-3 mb-10">
                    {[
                        { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", title: "Book in minutes, not hours", desc: "No cold calls. See verified availability before you reach out." },
                        { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Compliance on file", desc: "Insurance, state certs, and flag car docs verified upfront." },
                        { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", title: "Backfill in under 15 min", desc: "Tap into a live network instead of starting over from scratch." },
                        { icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", title: "Rated by other brokers", desc: "Trust scores built from real job completions — not self-reported." },
                    ].map(p => (
                        <div key={p.title} className="flex items-start gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                            <div className={`p-2 rounded-lg shrink-0 ${p.bg}`}>
                                <p.icon className={`w-4 h-4 ${p.color}`} />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{p.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Link
                    href={`/start?${signupParams.toString()}`}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl transition-all group shadow-lg shadow-amber-500/20"
                >
                    Get Access Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-center text-xs text-slate-600 mt-4">
                    No credit card needed. Free for brokers.
                </p>

                {/* Already have account */}
                <div className="mt-8 text-center">
                    <span className="text-slate-500 text-sm">Already have an account? </span>
                    <Link href={`/login?invite_token=${hash}`} className="text-amber-400 font-semibold text-sm hover:underline">
                        Sign in →
                    </Link>
                </div>

            </div>
        </div>
    );
}
