
import React from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="System Settings" />

            <div className="px-8 pt-4 border-b border-[#1a1a1a] flex gap-8">
                <Tab label="Feature Flags" active />
                <Tab label="Monetization" />
                <Tab label="Limits & Safety" />
                <Tab label="Phase Config" />
            </div>

            <div className="p-8 max-w-4xl space-y-12">
                <section className="space-y-6">
                    <header>
                        <h3 className="text-xl font-black uppercase italic text-[#ffb400] mb-1">Feature Flags</h3>
                        <p className="text-sm text-[#666]">Toggle major system modules globally.</p>
                    </header>

                    <div className="space-y-2">
                        <Toggle label="Performance Billing" active={false} description="Enabled lead-based charges for providers." />
                        <Toggle label="Heat Engine Map" active={true} description="Show scarcity overlays on driver dashboards." />
                        <Toggle label="Waze-Style Signals" active={true} description="Allow real-time crowd reporting in-field." />
                        <Toggle label="Confidence Engine" active={true} description="Compute corridor reliability scores." />
                        <Toggle label="Work-Fast Urgency" active={true} description="One-tap high-probability lead finder." />
                    </div>
                </section>

                <section className="space-y-6">
                    <header>
                        <h3 className="text-xl font-black uppercase italic text-[#666] mb-1">Operational Safety</h3>
                        <p className="text-sm text-[#444]">Enforce guardrails for data integrity.</p>
                    </header>

                    <div className="grid grid-cols-2 gap-6 bg-[#0c0c0c] border border-[#1a1a1a] p-8 rounded-xl">
                        <Input label="Max Reports / User / Day" value="5" />
                        <Input label="Dedupe Window (Mins)" value="30" />
                        <Input label="Min Quality Score (Lead)" value="60" />
                        <Input label="Fraud Cooldown (Hours)" value="24" />
                    </div>
                </section>

                <section className="space-y-6">
                    <header>
                        <h3 className="text-xl font-black uppercase italic text-[#444] mb-1">Autopilot Presets</h3>
                        <p className="text-sm text-[#333]">Apply bulk configuration changes.</p>
                    </header>
                    <div className="flex gap-4">
                        <button className="flex-1 py-4 border border-[#1a1a1a] bg-[#0c0c0c] rounded-lg text-[10px] font-black uppercase hover:border-[#ffb400]/50 transition-all">
                            Max Adoption
                        </button>
                        <button className="flex-1 py-4 border border-[#1a1a1a] bg-[#0c0c0c] rounded-lg text-[10px] font-black uppercase hover:border-green-500/50 transition-all text-green-500">
                            Max Trust
                        </button>
                        <button className="flex-1 py-4 border border-[#1a1a1a] bg-[#0c0c0c] rounded-lg text-[10px] font-black uppercase hover:border-red-500/50 transition-all text-red-500">
                            Max Revenue
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

function Toggle({ label, active, description }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg hover:border-[#333] transition-all">
            <div>
                <p className="text-xs font-black uppercase tracking-tight">{label}</p>
                <p className="text-[10px] text-[#444]">{description}</p>
            </div>
            <button className={`w-12 h-6 rounded-full relative transition-all ${active ? 'bg-[#ffb400]' : 'bg-[#1a1a1a]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-all ${active ? 'right-1' : 'left-1'}`}></div>
            </button>
        </div>
    );
}

function Input({ label, value }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#444]">{label}</label>
            <input
                type="text"
                defaultValue={value}
                className="w-full bg-[#070707] border border-[#1a1a1a] rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#ffb400]"
            />
        </div>
    );
}

function Tab({ label, active }: any) {
    return (
        <button className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-[#ffb400] text-[#ffb400]' : 'border-transparent text-[#444] hover:text-[#888]'}`}>
            {label}
        </button>
    );
}
