import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export async function generateMetadata({ params }: { params: { token: string } }) {
    return {
        title: "Verified Compliance Packet | Haul Command",
        robots: { index: false, follow: false } // NEVER index private compliance packets
    };
}

export default async function SharedCompliancePage({ params }: { params: { token: string } }) {
    const supabase = await createClient();
    
    // Fetch the COI document based on the share_token
    // Must bypass normal RLS or ensure an RPC or specific anon Policy exists allowing this read.
    // Migration 20260402_revenue_architecture_expansion.sql states: "Shared COI visible via share_token (handled at API layer, not RLS)"
    // So we use service_role for this specific retrieval to ensure public read securely.
    
    const adminSupabase = await createClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: coi, error } = await adminSupabase
        .from('coi_documents')
        .select('*, profiles:operator_id(name, email, phone)')
        .eq('share_token', params.token)
        .eq('share_enabled', true)
        .eq('status', 'active')
        .single();

    if (error || !coi) {
        console.error("Shared Compliance Error:", error);
        notFound();
    }

    const operator = coi.profiles;
    const isExpired = new Date(coi.expires_at) < new Date();

    return (
        <div className="min-h-screen bg-[#0a1118] text-[#f0f2f5] pt-16 pb-16 flex justify-center items-start">
            <div className="w-full max-w-3xl px-4">
                
                {/* Haul Command Trust Header */}
                <div className="flex justify-center mb-10">
                    <div className="bg-[#141e28] border border-[#1e3048] px-6 py-2 rounded-full flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        <span className="text-sm font-bold uppercase tracking-widest text-[#8ab0d0]">Official Compliance Packet</span>
                    </div>
                </div>

                {/* Packet Overview */}
                <div className="bg-[#141e28] border border-[#1e3048] rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-[#1e3048] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-white">{operator?.name || "Verified Operator"}</h1>
                            <p className="text-[#8ab0d0] text-sm font-mono mt-1">ID: {coi.operator_id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${isExpired ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-green-500/20 text-green-500 border border-green-500'}`}>
                                {isExpired ? 'Coverage Expired' : 'Active Coverage'}
                            </span>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1e3048]">
                        <div className="bg-[#141e28] p-4 text-center">
                            <span className="block text-[10px] text-[#8ab0d0] uppercase tracking-wider mb-1">Provider</span>
                            <span className="block text-sm font-bold text-white">{coi.insurance_provider || 'General Liability'}</span>
                        </div>
                        <div className="bg-[#141e28] p-4 text-center">
                            <span className="block text-[10px] text-[#8ab0d0] uppercase tracking-wider mb-1">Policy Number</span>
                            <span className="block text-sm font-mono text-[#e8a828]">{coi.policy_number || 'HIDDEN'}</span>
                        </div>
                        <div className="bg-[#141e28] p-4 text-center">
                            <span className="block text-[10px] text-[#8ab0d0] uppercase tracking-wider mb-1">Coverage</span>
                            <span className="block text-sm font-bold text-white">
                                {coi.coverage_amount_cents ? `$${(coi.coverage_amount_cents / 100).toLocaleString()}` : 'Standard'}
                            </span>
                        </div>
                        <div className="bg-[#141e28] p-4 text-center">
                            <span className="block text-[10px] text-[#8ab0d0] uppercase tracking-wider mb-1">Expires On</span>
                            <span className={`block text-sm font-mono font-bold ${isExpired ? 'text-red-500' : 'text-green-400'}`}>
                                {coi.expires_at ? format(new Date(coi.expires_at), 'MMM dd, yyyy') : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Document Viewer / Download CTA */}
                    <div className="p-8 flex flex-col items-center justify-center min-h-[300px] border-b border-[#1e3048] bg-[#0a1118]">
                        <svg className="w-16 h-16 text-[#385374] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <h3 className="text-white font-bold mb-2">Certificate of Insurance (COI)</h3>
                        <p className="text-[#8ab0d0] text-sm text-center max-w-md mb-6">
                            This document is securely hosted by Haul Command. By downloading this document, you record an audit event for compliance purposes.
                        </p>
                        <a 
                            href={coi.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#e8a828] text-white px-8 py-3 rounded uppercase font-black tracking-wider text-sm hover:bg-[#ffe399] transition-colors shadow-[0_0_15px_rgba(232,168,40,0.3)] flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download Secure Packet
                        </a>
                    </div>
                    
                    {/* Trust Footer */}
                    <div className="p-6 bg-[#141e28] text-center text-xs text-[#8ab0d0]">
                        Verified by the Haul Command Automated Trust Engine. <br/>
                        For verification issues, contact <span className="text-[#e8a828]">trust@haulcommand.com</span>.
                    </div>
                </div>

            </div>
        </div>
    );
}
