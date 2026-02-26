import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, MapPin, AlertTriangle, Zap, Clock } from "lucide-react";

export default async function OfferPage({ params }: { params: Promise<{ offerId: string }> }) {
    const { offerId } = await params;
    const supabase = supabaseServer();

    const { data: offer, error } = await supabase
        .from("offers")
        .select("id,status,expires_at,load_id,loads(title,origin_city,origin_state,dest_city,dest_state,urgency,pickup_at)")
        .eq("id", offerId)
        .single();

    if (error || !offer) {
        return (
            <div className="min-h-screen bg-[#070707] flex items-center justify-center text-center px-4">
                <div>
                    <AlertTriangle className="w-12 h-12 text-[#555] mx-auto mb-4" />
                    <h1 className="text-xl font-black text-white mb-2">Offer Not Found</h1>
                    <p className="text-[#555] text-sm">This offer may have expired or already been actioned.</p>
                    <Link href="/dashboard" className="mt-6 inline-block text-[#F1A91B] text-sm font-bold">
                        Go to Dashboard →
                    </Link>
                </div>
            </div>
        );
    }

    const accepted = (offer as any).status === "accepted";
    const declined = (offer as any).status === "declined";
    const expired = (offer as any).status === "expired";
    const load = (offer as any).loads as any;
    const urgencyColor = (load?.urgency ?? 0) >= 80 ? "#ff3c3c" : (load?.urgency ?? 0) >= 50 ? "#F1A91B" : "#22c55e";

    return (
        <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold mb-2">Haul Command · Offer</div>
                    <h1 className="text-2xl font-black text-white">
                        {accepted ? "✅ Offer Accepted" : declined ? "Offer Declined" : expired ? "Offer Expired" : "Load Offer"}
                    </h1>
                </div>

                {/* Load card */}
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-black text-white text-lg">{load?.title ?? "Unnamed Load"}</h2>
                        <span
                            className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
                            style={{ color: urgencyColor, background: urgencyColor + "15", border: `1px solid ${urgencyColor}30` }}
                        >
                            Urgency {load?.urgency ?? 0}
                        </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-[#aaa] mb-4">
                        <MapPin className="w-4 h-4 text-[#555] mt-0.5 flex-shrink-0" />
                        <span>
                            {load?.origin_city}, {load?.origin_state}
                            <span className="text-[#555] mx-2">→</span>
                            {load?.dest_city}, {load?.dest_state}
                        </span>
                    </div>

                    {load?.pickup_at && (
                        <div className="flex items-center gap-2 text-xs text-[#555]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pickup: {new Date(load.pickup_at).toLocaleString()}</span>
                        </div>
                    )}

                    {(offer as any).expires_at && !accepted && !declined && (
                        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                            <div className="text-[10px] text-[#555] uppercase tracking-widest">Offer Expires</div>
                            <div className="text-sm text-[#F1A91B] font-bold mt-0.5">
                                {new Date((offer as any).expires_at).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!accepted && !declined && !expired ? (
                    <div className="space-y-3">
                        <form action={`/api/offers/${offerId}/accept`} method="post">
                            <button
                                type="submit"
                                className="w-full py-4 bg-[#F1A91B] hover:bg-[#d4911a] text-black font-black text-base rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(241,169,27,0.25)] active:scale-98"
                            >
                                <Zap className="w-5 h-5 fill-black" />
                                ACCEPT THIS OFFER
                            </button>
                        </form>
                        <form action={`/api/offers/${offerId}/decline`} method="post">
                            <button
                                type="submit"
                                className="w-full py-3 border border-[#1a1a1a] text-[#555] hover:text-white text-sm rounded-xl transition-all"
                            >
                                Decline
                            </button>
                        </form>
                    </div>
                ) : accepted ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                            <div className="text-emerald-500 font-bold text-sm">Offer Accepted</div>
                            <div className="text-[#666] text-xs mt-0.5">The broker will contact you shortly.</div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-[#111] border border-[#1a1a1a] rounded-xl text-center text-[#555] text-sm">
                        This offer is no longer available.
                    </div>
                )}
            </div>
        </div>
    );
}
