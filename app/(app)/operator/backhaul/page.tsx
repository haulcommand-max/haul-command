"use client"

import React, { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Navigation2, Calendar, Truck } from "lucide-react"

export default function PostBackhaulPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const origin_city = formData.get('origin_city')
        const origin_state = formData.get('origin_state')
        const destination_city = formData.get('destination_city')
        const destination_state = formData.get('destination_state')
        const date = formData.get('date')

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // we must link this to the global operators table usually, but we fallback gracefully
            // the deployed schema uses operator_id references public.hc_global_operators(id)
            // for the sake of the prototype, we assume they have a global operator record mapped to their auth.
            
            const { data: globalOp } = await supabase
                .from('hc_global_operators')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (globalOp) {
                const toDate = new Date(date as string)
                toDate.setDate(toDate.getDate() + 3) // Assume available for 3 days from selected date

                await supabase.from('hc_reposition_broadcasts').insert({
                    operator_id: globalOp.id,
                    origin_city,
                    origin_state,
                    destination_city,
                    destination_state,
                    route_corridor: `${origin_state} to ${destination_state}`,
                    available_from: new Date(date as string).toISOString(),
                    available_to: toDate.toISOString()
                })
                setSuccess(true)
            } else {
                alert("You need a verified public profile to post a backhaul.")
            }
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div className=" bg-transparent flex items-center justify-center p-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-[#10B981]/20 text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Truck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Broadcast Live!</h2>
                    <p className="text-white/40 mb-8">Brokers searching along your corridor will now see your empty run availability.</p>
                    <a href="/operator" className="inline-block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition">
                        Return to Command
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className=" bg-transparent pt-24 pb-32">
            <div className="max-w-2xl mx-auto px-4 md:px-6">
                
                <div className="mb-8 border-b border-white/5 pb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                        Broadcast <span className="text-[#C6923A]">Backhaul</span>
                    </h1>
                    <p className="text-white/50">Signal a repositioning run. Brokers intercepting along this route will see your live capacity.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Origin */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500" /> Origin (Leaving From)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1">City</label>
                                <input name="origin_city" type="text" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C6923A] transition" placeholder="e.g. Houston" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1">State/Region Code</label>
                                <input name="origin_state" type="text" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C6923A] transition" placeholder="e.g. TX" />
                            </div>
                        </div>
                    </div>

                    {/* Destination */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Navigation2 className="w-4 h-4 text-emerald-500" /> Destination (Heading To)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1">City</label>
                                <input name="destination_city" type="text" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C6923A] transition" placeholder="e.g. Denver" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1">State/Region Code</label>
                                <input name="destination_state" type="text" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C6923A] transition" placeholder="e.g. CO" />
                            </div>
                        </div>
                    </div>

                    {/* Timing */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" /> Availability window
                        </h3>
                        <div>
                            <label className="block text-xs font-medium text-white/40 mb-1">Date leaving</label>
                            <input name="date" type="date" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C6923A] transition" />
                        </div>
                    </div>

                    {/* Submit */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#C6923A] hover:bg-[#b0802e] text-black font-black uppercase tracking-wider rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? 'Initializing Broadcast...' : 'Broadcast to Fleet Grid'}
                    </button>
                </form>

            </div>
        </div>
    )
}