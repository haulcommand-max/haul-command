"use client";

import { useState } from "react";
import { LiveKitVoiceAgent } from "./LiveKitVoiceAgent";
import { Phone, ShieldCheck } from "lucide-react";

export function InstantAIVerificationCard({ hcid, companyName }: { hcid: string | undefined, companyName: string | undefined }) {
    const [isActive, setIsActive] = useState(false);

    if (isActive) {
        return (
            <div className="w-full my-6 bg-[#0f1a24] border border-[#d4950e40] p-1 rounded-2xl animate-in fade-in zoom-in duration-300 relative">
                <div className="absolute -top-3 -right-3">
                    <span className="relative flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4950e] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-[#d4950e] text-black items-center justify-center text-[10px] font-bold border border-black">LIVE</span>
                    </span>
                </div>
                <LiveKitVoiceAgent 
                    roomName={`claim_${hcid || 'guest'}_${Date.now()}`} 
                    identity={`claimant_${Date.now()}`} 
                    role="claim_verifier" 
                    onClose={() => setIsActive(false)}
                />
                <div className="text-center p-3">
                    <p className="text-xs text-[#8ab0d0]">State your name and confirm your relation to <strong>{companyName || 'this company'}</strong>.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full my-6">
            <button 
                onClick={() => setIsActive(true)}
                type="button"
                className="w-full bg-gradient-to-r from-[#1e3048] to-[#141e28] hover:from-[#2a4365] hover:to-[#1e3048] border border-[#d4950e40] text-[#f0f2f5] font-bold py-4 px-6 rounded-xl text-sm transition-all shadow-lg flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-[#d4950e20] p-2 rounded-lg text-[#d4950e] group-hover:scale-110 transition-transform">
                        <Phone fill="currentColor" className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="block leading-none">Instant AI Voice Verification</span>
                        <span className="text-[10px] text-[#8ab0d0] font-normal leading-none mt-1.5 block">Skip the wait. Verify identity via automated phone agent instantly.</span>
                    </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#22c55e] opacity-50 group-hover:opacity-100" />
            </button>
            <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-[#1e3048]"></div>
                <span className="flex-shrink-0 mx-4 text-[#566880] text-xs font-semibold tracking-widest">OR</span>
                <div className="flex-grow border-t border-[#1e3048]"></div>
            </div>
        </div>
    );
}
