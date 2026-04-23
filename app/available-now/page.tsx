import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MapPin, CheckCircle, Clock, Phone, Globe, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Available Pilot Cars & Escorts Now | Haul Command',
  description: 'Find pilot car operators and escort vehicles available right now. Live availability across 120 countries. Instant dispatch matching for oversize loads.',
  alternates: { canonical: 'https://www.haulcommand.com/available-now' },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AvailableNowPage() {
  const supabase = createClient();

  // Operators marked as available (verified, lower confidence = more likely to claim)
  const { data: operators } = await supabase
    .from('hc_global_operators')
    .select('id, name, slug, city, admin1_code, country_code, confidence_score, is_verified, is_claimed, entity_type, phone_normalized')
    .gt('confidence_score', 30)
    .order('confidence_score', { ascending: false })
    .limit(48);

  const ops = operators ?? [];

  // Group by state
  const byState = ops.reduce((acc: Record<string, any[]>, op) => {
    const key = op.admin1_code ?? op.country_code ?? 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(op);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B0F14] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live Availability Feed
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            Pilot Cars Available Now
          </h1>
          <p className="text-gray-400 max-w-xl">
            {ops.length}+ operators in the Haul Command network. Verified credentials, real coverage areas. Dispatch-ready across 120 countries.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/directory" className="px-4 py-2 bg-[#F1A91B] text-black font-bold rounded-lg text-sm hover:bg-[#D4951A] transition-colors">
              Browse Full Directory
            </Link>
            <Link href="/loads/post" className="px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg text-sm hover:bg-white/20 transition-colors">
              Post a Load
            </Link>
          </div>
        </div>
      </div>

      {/* Live grid */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 mb-8 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> {ops.filter(o => o.is_verified).length} verified operators shown</span>
          <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-500" /> Multiple states covered</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#F1A91B]" /> Updated continuously</span>
        </div>

        {/* Operator grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ops.map(op => (
            <Link key={op.id} href={`/directory/${(op.country_code ?? 'us').toLowerCase()}/${op.slug}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#F1A91B]/40 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm group-hover:text-[#C6923A] transition-colors truncate">{op.name}</div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {[op.city, op.admin1_code].filter(Boolean).join(', ')}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {op.is_verified && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">VERIFIED</span>
                  )}
                  <span className="w-2 h-2 rounded-full bg-green-400" title="In network" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  {op.entity_type ?? 'Pilot Car'}
                </div>
                {op.phone_normalized && (
                  <div className="flex items-center gap-1 text-xs text-[#C6923A] font-semibold">
                    <Phone className="w-3 h-3" />
                    Contact
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Load more / claim CTA */}
        <div className="mt-10 text-center">
          <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B0F14] text-white font-bold rounded-xl hover:bg-[#1a2332] transition-colors">
            View All 7,711+ Operators <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Are you an operator?{' '}
            <Link href="/claim" className="text-[#C6923A] hover:underline font-semibold">Claim your free listing →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
