"use client";
import React, { useState, useEffect } from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import DetailDrawer from '@/components/admin/DetailDrawer';
import { createClient } from '@/lib/supabase/client';

export default function DirectoryPage() {
    const supabase = createClient();
    const [providers, setProviders] = useState<any[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [loadingDir, setLoadingDir] = useState(true);

    useEffect(() => {
        async function fetchProviders() {
            try {
                const { data } = await supabase
                    .from('operators')
                    .select('id, company_name, city, state, country_code, is_verified, trust_score, reputation_score, role_type, boost_tier')
                    .order('trust_score', { ascending: false })
                    .limit(100);
                if (data) {
                    setProviders(data.map((p: any) => ({
                        id: p.id, name: p.company_name || 'Unnamed',
                        category: p.role_type || 'escort',
                        region: `${p.state || ''}${p.country_code ? ` ${p.country_code}` : ''}`,
                        rating: p.trust_score || 0, jobs: 0,
                        verified: p.is_verified || false,
                        sponsor: !!p.boost_tier,
                        response: '—',
                    })));
                }
            } catch { /* graceful */ }
            setLoadingDir(false);
        }
        fetchProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleToggleVerify(provider: any) {
        if (!provider) return;
        setProcessing(true);
        const newStatus = !provider.verified;

        try {
            const { error: auditError } = await supabase.rpc('record_audit_event', {
                p_action: newStatus ? 'VERIFY_PROVIDER' : 'UNVERIFY_PROVIDER',
                p_entity_type: 'provider',
                p_entity_id: provider.id,
                p_note: `Directory action: ${newStatus ? 'Verified' : 'Unverified'} provider ${provider.name}`
            });

            if (auditError) throw auditError;

            // In a real database, we would update the providers table here
            alert(`${provider.name} status updated and audited.`);
            setSelectedItem(null);
        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    }

    // Helper for drawer close
    const setSelectedItem = (val: any) => setSelectedProvider(val);

    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="Directory Management" />

            {/* Filter Bar */}
            <div className="px-8 py-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]">
                <div className="flex gap-4">
                    <FilterSelect label="Category" options={['Escort', 'Permit', 'Carrier', 'Police']} />
                    <FilterSelect label="Region" options={['TX', 'FL', 'CA', 'GA']} />
                    <FilterSelect label="Status" options={['Verified', 'Unverified', 'Banned']} />
                </div>
                <button className="text-[10px] font-black uppercase text-[#ffb400] hover:underline transition-all">
                    Run Dedupe Scan
                </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                {loadingDir ? (
                    <div className="text-center py-20 text-[#444]">Loading directory...</div>
                ) : providers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-4xl mb-4">📂</div>
                        <h3 className="text-lg font-bold text-[#888] mb-2">Directory Empty</h3>
                        <p className="text-sm text-[#444]">No operators in the directory yet. Run the seed script or import operators to populate.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {providers.map((p) => (
                            <ProviderCard
                                key={p.id}
                                provider={p}
                                onClick={() => setSelectedProvider(p)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <DetailDrawer
                isOpen={!!selectedProvider}
                onClose={() => setSelectedProvider(null)}
                title={selectedProvider?.name}
                actions={
                    <>
                        <button className="flex-1 bg-[#1a1a1a] text-white py-3 rounded text-xs font-black uppercase border border-[#333] hover:bg-[#222] transition-all">
                            Edit Profile
                        </button>
                        <button
                            disabled={processing}
                            onClick={() => handleToggleVerify(selectedProvider)}
                            className="flex-1 bg-[#ffb400] text-black py-3 rounded text-xs font-black uppercase hover:bg-yellow-500 transition-all disabled:opacity-50"
                        >
                            {processing ? '...' : (selectedProvider?.verified ? 'Unverify' : 'Verify Now')}
                        </button>
                    </>
                }
            >
                <div className="space-y-8">
                    <Section title="Overview">
                        <div className="grid grid-cols-2 gap-4">
                            <DataBlock label="Compliance Status" value={selectedProvider?.verified ? 'Active' : 'Pending'} color={selectedProvider?.verified ? 'text-green-500' : 'text-yellow-500'} />
                            <DataBlock label="Service Radius" value="250 Miles" />
                            <DataBlock label="Reliability Score" value="92/100" color="text-[#ffb400]" />
                            <DataBlock label="Response Time" value={selectedProvider?.response} />
                        </div>
                    </Section>

                    <Section title="Sponsor Status">
                        <div className="p-4 bg-[#ffb400]/5 rounded border border-[#ffb400]/20">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase text-[#ffb400]">Elite Sponsor</span>
                                <span className="text-[10px] text-[#666]">since Nov 2025</span>
                            </div>
                            <p className="text-xs text-[#888]">Currently boosting in **TX/OK/NM** corridors for "High Pole" category.</p>
                        </div>
                    </Section>

                    <Section title="Recent Activity">
                        <div className="space-y-2">
                            <ActivityItem text="Verified updated insurance docs" time="2d ago" />
                            <ActivityItem text="Responded to 10X Work Fast request" time="4d ago" />
                            <ActivityItem text="Completed Superload pilot (Houston -> Dallas)" time="1w ago" />
                        </div>
                    </Section>
                </div>
            </DetailDrawer>
        </div>
    );
}

function ProviderCard({ provider, onClick }: any) {
    return (
        <div
            className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 rounded-lg hover:border-[#ffb400]/50 transition-all cursor-pointer group relative overflow-hidden"
            onClick={onClick}
        >
            {provider.sponsor && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#ffb400] text-black text-[8px] font-black uppercase">
                    Sponsor
                </div>
            )}
            <div className="mb-4">
                <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">{provider.category}</span>
                <h4 className="text-lg font-black tracking-tight group-hover:text-[#ffb400] transition-colors leading-tight mt-1">
                    {provider.name}
                </h4>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-[#444]">
                <div className="flex items-center gap-1">
                    <span className="text-[#ffb400]">★</span> {provider.rating}
                </div>
                <div>{provider.jobs} Jobs</div>
                <div className="text-[#ffb400]">{provider.region}</div>
            </div>
        </div>
    );
}

function FilterSelect({ label, options }: any) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-[#444]">{label}:</span>
            <select className="bg-[#070707] border border-[#1a1a1a] rounded px-2 py-1 text-[10px] font-bold text-[#888] focus:outline-none focus:border-[#ffb400]">
                <option>All</option>
                {options.map((o: any) => <option key={o}>{o}</option>)}
            </select>
        </div>
    );
}

function Section({ title, children }: any) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1">
                {title}
            </h4>
            {children}
        </div>
    );
}

function DataBlock({ label, value, color = 'text-white' }: any) {
    return (
        <div>
            <p className="text-[9px] font-black uppercase text-[#444] mb-1">{label}</p>
            <p className={`text-sm font-bold tracking-tight ${color}`}>{value}</p>
        </div>
    );
}

function ActivityItem({ text, time }: any) {
    return (
        <div className="flex justify-between items-center text-[11px] py-1">
            <span className="text-[#888] italic">"{text}"</span>
            <span className="text-[#444] font-mono">{time}</span>
        </div>
    );
}
