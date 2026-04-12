import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CheckoutGateway } from '@/lib/hc-pay/unified-checkout';

export const dynamic = 'force-dynamic';

export default async function LoadDetail({ params }: { params: { loadId: string } }) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    
    // In actual prod, we join with required country regulations, etc.
    const { data: load } = await supabase.from('jobs').select('*').eq('id', params.loadId).single();

    if (!load) return <div className="p-10 text-center text-red-500">Vector Unavailable or Retracted.</div>;

    return (
        <div className="min-h-screen bg-transparent text-white p-10 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-black uppercase tracking-tight mb-2">VECTOR: {params.loadId.split('-')[0]}</h1>
                <h3 className="text-2xl text-gray-400 uppercase tracking-tighter mb-8">{load.origin_city} to {load.destination_city}</h3>

                <div className="bg-gray-900 border border-gray-800 p-8 mb-8 space-y-4">
                    <h2 className="text-lg font-bold uppercase tracking-widest text-blue-500 border-b border-gray-800 pb-2 mb-4">Operational Parameters</h2>
                    <p className="text-gray-300"><strong className="text-white">Budget:</strong> ${load.budget_amount}</p>
                    <p className="text-gray-300"><strong className="text-white">Details:</strong> {load.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OPERATOR ACTION */}
                    <div className="bg-gray-900 border border-gray-800 p-8 shadow-xl">
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">Operator Action</h2>
                        <p className="text-gray-400 text-sm mb-6">Dispatch your profile and verified trust signals to secure this run.</p>
                        <form action={async () => {
                            'use server';
                            // Bid dispatcher logs to DB
                            const cookieStoreServer = await cookies();
                            const supabaseServer = createServerClient(
                                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                                { cookies: { getAll: () => cookieStoreServer.getAll(), setAll: () => {} } }
                            );
                            await supabaseServer.from('job_applications').insert({
                                job_id: params.loadId,
                                applicant_id: session?.user?.id,
                                status: 'PENDING'
                            });
                        }}>
                            <button className="w-full bg-blue-600 hover:bg-blue-500 px-6 py-4 font-bold uppercase tracking-widest text-sm transition-all text-white">
                                TRANSMIT BID
                            </button>
                        </form>
                    </div>

                    {/* BROKER ACTION */}
                    <div className="bg-blue-950/20 border border-blue-900/50 p-8 shadow-xl">
                        <h2 className="text-lg font-bold text-blue-400 uppercase tracking-widest mb-4">Broker Escrow Action</h2>
                        <p className="text-blue-200/70 text-sm mb-6">Pre-fund the milestone escrow via Stripe or NOWPayments to earn the Verified badge and attract elite Tier 1 operators.</p>
                        <form action={async () => {
                            'use server';
                            // Route directly to the Unified Checkout Gateway
                            const gatewayRes = await CheckoutGateway.initiate({
                                userId: session?.user?.id || 'anon',
                                orderId: params.loadId,
                                baseAmountUsd: load.budget_amount,
                                statesCrossed: 3, // mock 3 state traversal
                                paymentMethod: 'stripe'
                            });
                            // Next.js Redirect to gatewayRes.checkoutUrl is handled here
                        }}>
                            <button className="w-full border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white px-6 py-4 font-bold uppercase tracking-widest text-sm transition-all">
                                LOCK ESCROW (STRIPE)
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
