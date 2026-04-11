import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export default async function VendorDashboard({ params }: { params: { vendorId: string } }) {
    const supabase = createServerComponentClient({ cookies });
    
    // Vendor metrics query
    const { data: vendor } = await supabase.from('hc_vendors').select('*').eq('vendor_slug', params.vendorId).single();
    
    if (!vendor) return <div className="p-10 font-mono text-red-500">Access Denied: Unregistered Affiliate Vector.</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-10 font-sans">
            <h1 className="text-4xl font-black uppercase text-white mb-2">Partner AdGrid: {vendor.vendor_name}</h1>
            <p className="text-blue-500 font-mono tracking-widest text-xs mb-8 uppercase">Live Pipeline Telemetry</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-blue-500 p-6 shadow-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Total Impressions</p>
                    <h2 className="text-3xl font-black">14,204</h2>
                </div>
                <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-green-500 p-6 shadow-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Converted Clicks</p>
                    <h2 className="text-3xl font-black">832</h2>
                </div>
                <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-yellow-500 p-6 shadow-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Generated RoAS Flow</p>
                    <h2 className="text-3xl font-black text-green-400">$24,109</h2>
                </div>
            </div>
            
            <div className="mt-10 bg-gray-900 border border-gray-800 p-8">
                <h3 className="text-lg font-bold text-white tracking-widest uppercase border-b border-gray-800 pb-4 mb-6">Targeting Focus</h3>
                <p className="text-gray-400 text-sm">
                    Currently injecting <span className="font-mono text-blue-400">{vendor.affiliate_url}</span> into Operator Diagnostic workflows specifically capturing {vendor.category} compliance gaps.
                </p>
            </div>
        </div>
    )
}
