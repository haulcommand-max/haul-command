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
        <div className="pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* Headers & Hero */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C6923A]/10 border border-[#C6923A]/20 rounded-full mb-4">
                            <Shield className="w-3 h-3 text-[#C6923A]" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#C6923A]">Compliance Engine</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                            Digital <span className="text-[#C6923A]">Forms Hub</span>
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
                            Stop chasing paperwork. Instantly generate, autofill, and securely store mandatory W-9s, Certificates of Insurance, and Pre-Trip Surveys. Brokers receive verified PDFs instantly.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-3">
                        <a href="/login" className="px-6 py-3 bg-[#C6923A] text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-[#b0802e] transition shadow-sm">
                            Auto-Fill Forms &rarr;
                        </a>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Required Forms */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Required Network Templates</h2>
                        
                        {templates && templates.length > 0 ? (
                            templates.map((template: any) => (
                                <div key={template.id} className="group relative bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-6 h-6 text-[#C6923A]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">{template.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                        template.form_category === 'finance' ? 'bg-emerald-50 text-emerald-700' : 
                                                        template.form_category === 'compliance' ? 'bg-blue-50 text-blue-700' :
                                                        'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {template.form_category}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                                                <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> E-Signature Required</span>
                                                    <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Vendor Acceptable</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-5 border-t border-gray-200 flex gap-3">
                                        <a href="/login" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition">Preview Document</a>
                                        <a href="/login" className="px-4 py-2 bg-[#C6923A]/10 hover:bg-[#C6923A]/20 text-[#C6923A] text-xs font-bold rounded-lg transition ml-auto">Autofill &amp; Sign &rarr;</a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 p-8 border border-gray-200 border-dashed rounded-2xl text-center">
                                No templates currently deployed in network.
                            </div>
                        )}
                        
                        {/* Static Lead-gen SEO hook for custom uploads */}
                        <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-2xl p-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <UploadCloud className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Certificates of Insurance (COI)</h3>
                                    <p className="text-sm text-gray-500 mb-4">Securely upload and store your external COI PDFs. Smart OCR automatically extracts your policy limits for broker verification.</p>
                                    <a href="/login" className="text-emerald-600 text-xs font-bold hover:underline">Go to Secure Vault &rarr;</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Trust & Reminders Engine */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#C6923A]" /> Smart Reminders
                            </h3>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Never fall out of compliance. Haul Command automatically emails you and your brokered partners 30 days before insurance or CDL expiry.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-900">General Liability</div>
                                        <div className="text-[10px] text-gray-400">Expires Nov 2026</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-200">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-rose-600">TX Pre-Trip Survey</div>
                                        <div className="text-[10px] text-rose-400">Missing for active load HTX-882</div>
                                    </div>
                                    <a href="/login" className="ml-auto text-[10px] bg-rose-500 text-white px-2 py-1 rounded font-bold">Fix</a>
                                </div>
                            </div>
                        </div>
                        
                        {/* Premium Upsell */}
                        <div className="bg-gradient-to-br from-[#C6923A]/10 to-white border border-[#C6923A]/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C6923A]/5 blur-[50px] rounded-full" />
                            <h3 className="font-black text-gray-900 text-xl mb-2 relative z-10">Permit Concierge</h3>
                            <p className="text-xs text-gray-500 mb-6 relative z-10 leading-relaxed">
                                Need Nationwide Oversize Load Permits? Skip the line. Our logistics team processes permits 3x faster using your vaulted credentials.
                            </p>
                            <a href="/permits" className="block w-full text-center py-3 bg-[#C6923A] text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#b0802e] transition relative z-10 shadow-sm">
                                Request Permits &rarr;
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}