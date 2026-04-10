import { createClient } from "@supabase/supabase-js"
import { Shield, Truck, MapPin, Search } from "lucide-react"

export default async function RepositioningFeed() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Fetch active backhauls from our newly deployed table
    const { data: backhauls } = await supabase
        .from('v_reposition_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="min-h-screen bg-[#07090D] pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* Header */}
                <div className="mb-12 border-b border-white/5 pb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">Live Network</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Operator <span className="text-[#C6923A]">Backhauls</span>
                    </h1>
                    <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
                        Live repositioning broadcasts from verified heavy haul and escort operators. Catch them while they are empty and secure lower rates along these active corridors.
                    </p>
                </div>

                {/* Feed */}
                <div className="grid gap-4">
                    {backhauls && backhauls.length > 0 ? (
                        backhauls.map((hauls: any) => (
                            <div key={hauls.id} className="group flex flex-col md:flex-row items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition">
                                
                                <div className="flex-1 w-full flex flex-col md:flex-row gap-6 mb-4 md:mb-0">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-[#C6923A]" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">{hauls.operator_name}</h3>
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-white/40">
                                                {hauls.service_types?.[0] || 'Escort Operator'}
                                            </span>
                                            {hauls.trust_score >= 80 && (
                                                <span className="flex items-center gap-1 text-[10px] text-[#C6923A] font-bold">
                                                    <Shield className="w-3 h-3" /> Verified
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/60 font-medium">
                                            <div className="flex items-center gap-1.5 text-white">
                                                <MapPin className="w-4 h-4 text-rose-500" />
                                                {hauls.origin_city}, {hauls.origin_state}
                                            </div>
                                            <div className="hidden md:block w-4 h-[1px] bg-white/20" />
                                            <div className="flex items-center gap-1.5 text-white">
                                                <MapPin className="w-4 h-4 text-emerald-500" />
                                                {hauls.destination_city}, {hauls.destination_state}
                                            </div>
                                            <div className="hidden md:block w-4 h-[1px] bg-white/20" />
                                            <div className="flex items-center gap-1.5 text-[#C6923A]">
                                                Corridor: {hauls.route_corridor}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                    <div className="text-xs text-white/30 font-medium uppercase tracking-widest">
                                        Until {new Date(hauls.available_to).toLocaleDateString()}
                                    </div>
                                    <a 
                                        href={`/directory/profile/${hauls.operator_slug}`} 
                                        className="px-6 py-2.5 bg-[#C6923A] hover:bg-[#C6923A]/90 text-black font-black uppercase text-xs tracking-wider rounded-lg transition"
                                    >
                                        Intercept Load →
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-3xl">
                            <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <h3 className="text-white font-bold text-xl mb-2">No Active Backhauls</h3>
                            <p className="text-white/40">There are currently no operators broadcasting empty runs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
