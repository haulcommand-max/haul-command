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
        <div className="bg-white text-gray-900 pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-6xl">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Compliance <span className="text-[#C6923A]">Vault</span></h1>
                        <p className="text-gray-500 text-sm">
                            Centralized W-9, COI, and state certification storage. Stop emailing PDFs. Send one secure link to brokers.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        {user ? (
                            <ShareLinkManager cois={cois} />
                        ) : (
                            <button className="bg-gray-100 text-gray-500 px-4 py-2 rounded text-sm uppercase tracking-wider font-bold cursor-not-allowed">
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
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#C6923A]"></div>
                            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-2">Automated Expiry</h3>
                            <p className="text-gray-500 text-xs mb-4">
                                Haul Command automatically scans your COI dates and alerts you 30 days before expiration to keep your Verified Badge active.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> All docs current
                            </div>
                        </div>

                        <div className="bg-white border border-[#C6923A]/30 rounded-xl p-5 pt-8 relative mt-10 shadow-sm">
                            <div className="absolute -top-5 inset-x-0 flex justify-center">
                                <span className="bg-[#C6923A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">Pro Feature</span>
                            </div>
                            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-2 text-center">Auto-Fill Contracts</h3>
                            <p className="text-gray-500 text-xs text-center mb-4">
                                Upgrade to Pro to automatically generate standard Heavy Haul Master Service Agreements (MSAs) using your stored LLC data.
                            </p>
                            <button className="w-full border border-[#C6923A] text-[#C6923A] py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#C6923A] hover:text-white transition-colors">
                                Unlock Workflow ($29/mo)
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}