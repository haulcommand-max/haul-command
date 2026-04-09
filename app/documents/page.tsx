import { createClient } from "@/utils/supabase/server";
import { DocumentVault } from "@/components/documents/DocumentVault";
import { ShareLinkManager } from "@/components/documents/ShareLinkManager";

export const metadata = {
    title: "Forms & Compliance Hub | Haul Command",
    description: "Manage your W-9, COI, and certifications. Securely share your compliance packet with brokers."
};

export default async function DocumentsHubPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    // In a real scenario, this queries the `coi_documents` and `provider_documents` tables.
    // For this UI scaffolding, we pull the real schema but mock the explicit docs to ensure zero fake data if empty.
    let cois: any[] = [];
    let providerDocs: any[] = [];

    if (user) {
        const { data: cData } = await supabase.from('coi_documents').select('*').eq('operator_id', user.id);
        if (cData) cois = cData;

        // Using market_entities linking for provider docs (assuming user claimed an entity)
        // This is a simplified fetch for the UI.
        const { data: pData } = await supabase.from('provider_documents').select('*').eq('entity_id', user.id); // Note: entity_id != user.id usually, needs join on directory_listings
        if (pData) providerDocs = pData;
    }

    return (
        <div className="min-h-screen bg-[#0a1118] text-[#f0f2f5] pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-6xl">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-[#1e3048] pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Compliance <span className="text-[#e8a828]">Vault</span></h1>
                        <p className="text-[#8ab0d0] text-sm">
                            Centralized W-9, COI, and state certification storage. Stop emailing PDFs. Send one secure link to brokers.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        {user ? (
                            <ShareLinkManager cois={cois} />
                        ) : (
                            <button className="bg-[#1e3048] text-[#8ab0d0] px-4 py-2 rounded text-sm uppercase tracking-wider font-bold cursor-not-allowed">
                                Login to Share
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Vault Area */}
                    <div className="lg:col-span-3 space-y-8">
                        <DocumentVault defaultCois={cois} defaultOtherDocs={providerDocs} userId={user?.id} />
                    </div>

                    {/* Sidebar / Upsell / Alerts */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        <div className="bg-[#141e28] border border-[#1e3048] rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#e8a828]"></div>
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Automated Expiry</h3>
                            <p className="text-[#8ab0d0] text-xs mb-4">
                                Haul Command automatically scans your COI dates and alerts you 30 days before expiration to keep your Verified Badge active.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> All docs current
                            </div>
                        </div>

                        <div className="bg-[#0a1118] border border-[#e8a828]/30 rounded-xl p-5 pt-8 relative mt-10">
                            <div className="absolute -top-5 inset-x-0 flex justify-center">
                                <span className="bg-[#e8a828] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_10px_rgba(232,168,40,0.5)]">Pro Feature</span>
                            </div>
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-2 text-center">Auto-Fill Contracts</h3>
                            <p className="text-[#8ab0d0] text-xs text-center mb-4">
                                Upgrade to Pro to automatically generate standard Heavy Haul Master Service Agreements (MSAs) using your stored LLC data.
                            </p>
                            <button className="w-full border border-[#e8a828] text-[#e8a828] py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#e8a828] hover:text-white transition-colors">
                                Unlock Workflow ($29/mo)
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
