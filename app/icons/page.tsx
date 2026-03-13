'use client';

import React, { useState } from 'react';
import { HC_ICON_REGISTRY, type HcVariant } from '@/components/icons';

const SIZES = [14, 16, 18, 20, 24, 32];
const VARIANTS: HcVariant[] = ['outline', 'filled', 'duotone', 'active_selected', 'map_pin', 'badge_mini', 'app_nav', 'empty_state'];

const GROUP_LABELS: Record<string, string> = {
    core_market: '🏗️ Core Market',
    infrastructure: '🛣️ Infrastructure',
    support_services: '🔧 Support Services',
    commerce_marketplace: '🏪 Commerce & Marketplace',
    compliance_finance: '📋 Compliance & Finance',
    platform_surfaces: '💻 Platform Surfaces',
    status_badges: '🏷️ Status Badges',
};

const PRIORITY_COLORS: Record<string, string> = {
    P0: 'bg-[#C6923A]/20 text-[#C6923A]',
    P1: 'bg-blue-500/20 text-blue-400',
    P2: 'bg-purple-500/20 text-purple-400',
    P3: 'bg-gray-500/20 text-gray-400',
};

export default function IconPreviewPage() {
    const [activeSize, setActiveSize] = useState(24);
    const [activeVariant, setActiveVariant] = useState<HcVariant>('outline');
    const [darkMode, setDarkMode] = useState(true);
    const [search, setSearch] = useState('');
    const [activeGroup, setActiveGroup] = useState<string>('all');

    const groups = [...new Set(HC_ICON_REGISTRY.map(i => i.group))];

    const filtered = HC_ICON_REGISTRY.filter(icon => {
        if (search && !icon.label.toLowerCase().includes(search.toLowerCase()) && !icon.id.includes(search.toLowerCase())) return false;
        if (activeGroup !== 'all' && icon.group !== activeGroup) return false;
        return true;
    });

    const bg = darkMode ? 'bg-[#0B0B0C] text-white' : 'bg-gray-50 text-gray-900';
    const headerBg = darkMode ? 'bg-[rgba(11,11,12,0.97)] border-white/10' : 'bg-white/97 border-gray-200';
    const cardBg = darkMode
        ? 'bg-[rgba(255,255,255,0.02)] border-white/[0.06] hover:border-[#C6923A]/30 hover:bg-white/[0.04]'
        : 'bg-white border-gray-200 hover:border-[#C6923A]/40 hover:shadow-md';
    const mutedText = darkMode ? 'text-gray-500' : 'text-gray-400';
    const subText = darkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={`min-h-screen transition-colors ${bg}`}>
            <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${headerBg}`}>
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">HAUL COMMAND Icon System</h1>
                            <p className={`text-sm mt-0.5 ${subText}`}>
                                <span className="text-[#C6923A] font-bold">{HC_ICON_REGISTRY.length}</span> icons &middot; <span className="text-[#C6923A] font-bold">8</span> variants &middot; <span className="text-[#C6923A] font-bold">{HC_ICON_REGISTRY.length * 8}</span> total states
                            </p>
                        </div>
                        <button onClick={() => setDarkMode(!darkMode)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}>
                            {darkMode ? '☀ Light' : '🌙 Dark'}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search icons..." className={`px-3 py-1.5 rounded-lg text-sm border ${darkMode ? 'bg-white/5 border-white/10 placeholder:text-gray-600' : 'bg-gray-50 border-gray-200'}`} />
                        <div className="flex gap-1 flex-wrap">
                            <button onClick={() => setActiveGroup('all')} className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${activeGroup === 'all' ? 'bg-[#C6923A]/20 text-[#C6923A] border border-[#C6923A]/30' : `${mutedText} border border-transparent`}`}>All ({HC_ICON_REGISTRY.length})</button>
                            {groups.map(g => {
                                const count = HC_ICON_REGISTRY.filter(i => i.group === g).length;
                                return <button key={g} onClick={() => setActiveGroup(g)} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${activeGroup === g ? 'bg-[#C6923A]/20 text-[#C6923A] border border-[#C6923A]/30' : `${mutedText} border border-transparent`}`}>{g.replace(/_/g, ' ')} ({count})</button>;
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${mutedText}`}>Size</span>
                            {SIZES.map(s => (
                                <button key={s} onClick={() => setActiveSize(s)} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeSize === s ? 'bg-[#C6923A]/20 text-[#C6923A]' : mutedText}`}>{s}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${mutedText}`}>Variant</span>
                            {VARIANTS.map(v => (
                                <button key={v} onClick={() => setActiveVariant(v)} className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${activeVariant === v ? 'bg-[#C6923A]/20 text-[#C6923A]' : mutedText}`}>{v.replace(/_/g, ' ')}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-6">
                {activeGroup === 'all' ? groups.map(group => {
                    const icons = filtered.filter(i => i.group === group);
                    if (!icons.length) return null;
                    return (
                        <div key={group} className="mb-8">
                            <h2 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="text-[#C6923A]">{GROUP_LABELS[group] || group}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>{icons.length}</span>
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-10 gap-2">
                                {icons.map(icon => <IconCard key={icon.id} icon={icon} size={activeSize} variant={activeVariant} darkMode={darkMode} cardBg={cardBg} mutedText={mutedText} />)}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-10 gap-2">
                        {filtered.map(icon => <IconCard key={icon.id} icon={icon} size={activeSize} variant={activeVariant} darkMode={darkMode} cardBg={cardBg} mutedText={mutedText} />)}
                    </div>
                )}

                {/* All-variants strip */}
                <div className={`mt-10 p-6 rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-sm font-black uppercase tracking-wider mb-4">All 8 Variants — Side by Side</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filtered.slice(0, 30).map(icon => {
                            const Ic = icon.component;
                            return (
                                <div key={icon.id} className={`flex items-center gap-4 py-2 border-b ${darkMode ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                                    <span className={`w-36 text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${mutedText}`}>{icon.label}</span>
                                    {VARIANTS.map(v => (
                                        <div key={v} className="flex flex-col items-center gap-0.5">
                                            <Ic size={activeSize} variant={v} />
                                            <span className={`text-[6px] ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>{v.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function IconCard({ icon, size, variant, darkMode, cardBg, mutedText }: any) {
    const Ic = icon.component;
    return (
        <div className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.03] cursor-default ${cardBg}`}>
            <span className={`absolute top-1 right-1 text-[7px] font-bold px-1 py-0.5 rounded ${PRIORITY_COLORS[icon.priority]}`}>{icon.priority}</span>
            <div className={`transition-colors ${darkMode ? 'text-gray-300 group-hover:text-[#C6923A]' : 'text-gray-600 group-hover:text-[#C6923A]'}`}>
                <Ic size={size} variant={variant} />
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-wider text-center leading-tight ${mutedText}`}>{icon.label}</span>
        </div>
    );
}
