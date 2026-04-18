import { createClient } from "@supabase/supabase-js"
import { FileText, CheckCircle, Shield, UploadCloud, Clock, AlertTriangle } from "lucide-react"

export default async function FormsHubPage() {
    // We run this as server component
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Fetch active form templates 
    const { data: templates } = await supabase
        .from('hc_form_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    return (
        <div className=" bg-transparent pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* â”€â”€ SEO Headers & Hero â”€â”€ */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C6923A]/10 border border-[#C6923A]/20 rounded-full mb-4">
                            <Shield className="w-3 h-3 text-[#C6923A]" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#C6923A]">Compliance Engine</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Digital <span className="text-[#C6923A]">Forms Hub</span>
                        </h1>
                        <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
                            Stop chasing paperwork. Instantly generate, autofill, and securely store mandatory W-9s, Certificates of Insurance, and Pre-Trip Surveys. Brokers receive verified PDFs instantly.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-3">
                        <a href="/login" className="px-6 py-3 bg-[#C6923A] text-black font-black uppercase text-sm tracking-widest rounded-xl hover:bg-[#b0802e] transition shadow-[0_0_20px_rgba(198,146,58,0.2)]">
                            Auto-Fill Forms â†’
                        </a>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* â”€â”€ Left Column: Required Forms â”€â”€ */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-2">Required Network Templates</h2>
                        
                        {templates && templates.length > 0 ? (
                            templates.map((template: any) => (
                                <div key={template.id} className="group relative bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-6 h-6 text-[#C6923A]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-white">{template.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                        template.form_category === 'finance' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                        template.form_category === 'compliance' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-white/10 text-white/40'
                                                    }`}>
                                                        {template.form_category}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-white/50 mb-3">{template.description}</p>
                                                <div className="flex items-center gap-4 text-xs font-medium text-white/30">
                                                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> E-Signature Required</span>
                                                    <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Vendor Acceptable</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-5 border-t border-white/5 flex gap-3">
                                        <a href="/login" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition">Preview Document</a>
                                        <a href="/login" className="px-4 py-2 bg-[#C6923A]/10 hover:bg-[#C6923A]/20 text-[#C6923A] text-xs font-bold rounded-lg transition ml-auto">Autofill & Sign â†’</a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-white/40 p-8 border border-white/5 border-dashed rounded-2xl text-center">
                                No templates currently deployed in network.
                            </div>
                        )}
                        
                        {/* Static Lead-gen SEO hook for custom uploads */}
                        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <UploadCloud className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Upload Certificates of Insurance (COI)</h3>
                                    <p className="text-sm text-white/50 mb-4">Securely upload and store your external COI PDFs. Smart OCR automatically extracts your policy limits for broker verification.</p>
                                    <a href="/login" className="text-emerald-400 text-xs font-bold hover:underline">Go to Secure Vault â†’</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* â”€â”€ Right Column: Trust & Reminders Engine â”€â”€ */}
                    <div className="space-y-6">
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#C6923A]" /> Smart Reminders
                            </h3>
                            <p className="text-xs text-white/40 mb-6 leading-relaxed">
                                Never fall out of compliance. Haul Command automatically emails you and your brokered partners 30 days before insurance or CDL expiry.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-white">General Liability</div>
                                        <div className="text-[10px] text-white/40">Expires Nov 2026</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-rose-400">TX Pre-Trip Survey</div>
                                        <div className="text-[10px] text-rose-400/60">Missing for active load HTX-882</div>
                                    </div>
                                    <a href="/login" className="ml-auto text-[10px] bg-rose-500 text-white px-2 py-1 rounded font-bold">Fix</a>
                                </div>
                            </div>
                        </div>
                        
                        {/* 15X Premium Upsell directly harvesting "Missing Money" */}
                        <div className="bg-gradient-to-br from-[#C6923A]/20 to-transparent border border-[#C6923A]/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C6923A]/10 blur-[50px] rounded-full" />
                            <h3 className="font-black text-white text-xl mb-2 relative z-10">Permit Concierge</h3>
                            <p className="text-xs text-white/60 mb-6 relative z-10 leading-relaxed">
                                Need Nationwide Oversize Load Permits? Skip the line. Our logistics team processes permits 3x faster using your vaulted credentials.
                            </p>
                            <a href="/permits" className="block w-full text-center py-3 bg-[#C6923A] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#b0802e] transition relative z-10 shadow-[0_0_15px_rgba(198,146,58,0.3)]">
                                Request Permits â†’
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}