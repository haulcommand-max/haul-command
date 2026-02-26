import Link from "next/link";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";

export default function ClaimSuccessPage({ params }: { params: { profileId: string } }) {
    return (
        <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>

                <h1 className="text-3xl font-black text-white mb-3">Profile Claimed!</h1>
                <p className="text-[#666] text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                    Your identity has been verified. You now own this profile and can receive live dispatch offers.
                </p>

                <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6 mb-6 text-left space-y-3">
                    {[
                        "Direct push notification offers",
                        "Full contact number visible to brokers",
                        "Real-time availability toggle",
                        "Priority matching algorithm",
                    ].map(item => (
                        <div key={item} className="flex items-center gap-3 text-sm text-[#aaa]">
                            <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                            </div>
                            {item}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/dashboard/profile"
                        className="w-full py-3.5 bg-[#F1A91B] text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-[#d4911a] transition-all"
                    >
                        <Zap className="w-4 h-4" />
                        Complete Your Profile
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/directory"
                        className="w-full py-3 border border-[#1a1a1a] text-[#666] text-sm rounded-xl hover:text-white hover:border-[#333] transition-all"
                    >
                        Back to Directory
                    </Link>
                </div>
            </div>
        </div>
    );
}
