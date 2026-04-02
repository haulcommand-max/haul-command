import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OfferDeck from "./OfferDeck";

export default async function OfferDispatcherPage({
    searchParams,
}: {
    searchParams: Promise<{ request?: string }>;
}) {
    const { request } = await searchParams;
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/offers${request ? `?request=${request}` : ''}`);
    }

    // If no specific request, route them to their global inbox
    if (!request) {
        redirect('/offers/inbox');
    }

    // Fetch the specific offers tied to this Request ID for this operator
    const { data: offers } = await supabase
        .from('offers')
        .select(`*, hc_loads(id, origin_city, destination_city, urgency, length_ft, width_ft, height_ft, pickup_window_start, destination_state, origin_state)`)
        .eq('request_id', request)
        .eq('operator_id', user.id)
        .in('status', ['sent', 'viewed'])
        .order('created_at', { ascending: false });

    if (!offers || offers.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-4">📭</div>
                <h1 className="text-xl font-black mb-2">No Active Offers Found</h1>
                <p className="text-slate-400 text-center text-sm max-w-sm mb-6">
                    The offers for this request have either expired, been claimed by another operator, or you already responded.
                </p>
                <a href="/offers/inbox" className="px-6 py-3 bg-[#1e293b] rounded-full font-bold text-sm">
                    View Inbox
                </a>
            </div>
        );
    }

    // Mark as viewed since they opened the push notification
    const unviewedIds = offers.filter((o: any) => o.status === 'sent').map((o: any) => o.offer_id);
    if (unviewedIds.length > 0) {
        await supabase.from('offers').update({ status: 'viewed' }).in('offer_id', unviewedIds);
    }

    return <OfferDeck initialOffers={offers} userId={user.id} />;
}
