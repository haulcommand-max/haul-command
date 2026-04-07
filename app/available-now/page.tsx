import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, Navigation, MapPin, Truck, Shield, Calendar, ArrowRight, ChevronRight, HardHat, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Available Now — Live Escort Operations | Haul Command',
  description: 'Live availability feed of heavy haul escort operators and pilot cars ready for dispatch right now.',
  alternates: { canonical: 'https://haulcommand.com/available-now' },
};

interface AvailableNowRecord {
  id: string;
  display_name: string;
  organization_slug: string | null;
  lat: number;
  lng: number;
  city_name: string | null;
  state_code: string | null;
  country_code: string;
  vehicle_type: string;
  service_type: string | null;
  equipment_note: string | null;
  trust_score: number;
  available_until: string | null;
  created_at: string;
  contact_phone: string | null;
}

export default async function AvailableNowPage() {
  const supabase = createClient();

  const { data: records, error } = await supabase
    .from('hc_available_now')
    .select('*')
    .order('trust_score', { ascending: false })
    .limit(40);

  const availableOperators: AvailableNowRecord[] = (!error && records) ? records : [];
  const totalAvailable = availableOperators.length;

  return (
    <>
      <div className="min-h-screen bg-[#060b12] text-white">
        {/* Desktop Ambient Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Hero Section */}
        <div className="relative border-b border-white/[0.05] overflow-hidden pt-14 pb-10 px-6">
          <div className="max-w-6xl mx-auto">
            <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-green-500">Available Now</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-500 uppercase tracking-widest mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live Availability Feed
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
              Ready for <span className="text-green-500">Dispatch</span>.
            </h1>
            <p className="text-gray-400 max-w-xl text-lg mb-6 leading-relaxed">
              Book operators actively sitting empty and waiting for a load. Secure coverage faster without calling dead numbers.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <span className="text-xl font-black text-green-500">{totalAvailable > 0 ? totalAvailable : '0'}</span>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Standing By</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {totalAvailable > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
              {availableOperators.map(op => {
                const trustPct = Math.min(Math.round(op.trust_score * 10), 100);
                const trustColor = trustPct >= 80 ? 'text-green-500 bg-green-500/10 border-green-500/20' : 
                                   trustPct >= 50 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 
                                   'text-gray-400 bg-gray-500/10 border-gray-500/20';
                
                return (
                  <div key={op.id} className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/10 rounded-2xl p-5 flex flex-col h-full group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-shrink-0 items-center justify-center text-green-500">
                           <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white line-clamp-1">{op.display_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {op.city_name ? `${op.city_name}, ${op.state_code}` : 'Location Available upon request'}
                          </div>
                        </div>
                      </div>
                      <div className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-md border ${trustColor}`}>
                        {trustPct}% Trust
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-5">
                       {op.vehicle_type && (
                         <div className="flex items-start gap-2 text-xs text-gray-400">
                           <Truck className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                           <span className="capitalize">{op.vehicle_type.replace(/_/g, ' ')}</span>
                           {op.service_type && <span className="capitalize text-gray-500">• {op.service_type.replace(/_/g, ' ')}</span>}
                         </div>
                       )}
                       {op.equipment_note && (
                         <div className="flex items-start gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded-lg border border-white/5">
                           <HardHat className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                           <span className="italic">"{op.equipment_note}"</span>
                         </div>
                       )}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                       {op.organization_slug ? (
                         <Link href={`/directory/profile/${op.organization_slug}`} className="flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                           Profile <ArrowRight className="w-3.5 h-3.5" />
                         </Link>
                       ) : (
                         <Link href="/directory" className="flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                           Directory <ArrowRight className="w-3.5 h-3.5" />
                         </Link>
                       )}
                       {op.contact_phone ? (
                         <a href={`tel:${op.contact_phone}`} className="flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-400 text-black rounded-lg text-xs font-bold transition-colors">
                           <Phone className="w-3.5 h-3.5" /> Call Now
                         </a>
                       ) : (
                         <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white/10 text-gray-500 rounded-lg text-xs font-bold cursor-not-allowed">
                           Message App
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center max-w-2xl mx-auto mb-20 shadow-2xl">
              <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <Clock className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-black mb-3 text-white">No Immediate Availability</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md mx-auto">
                There are no operators broadcasting an "Available Now" status in your selected regions currently.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/claim" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition-all">
                  Broadcast Your Availability
                </Link>
                <Link href="/reposition" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 border border-white/10 transition-all">
                  View Repositioning Routes
                </Link>
              </div>
            </div>
          )}

          {/* Infrastructure Cross-Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
            <Link href="/loads" className="group rounded-2xl bg-[#0b0c10] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors">
              <MapPin className="w-6 h-6 text-blue-500 mb-4" />
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-500 transition-colors">Find Loads</h3>
              <p className="text-xs text-gray-500">Post or browse available heavy haul and project cargo loads requiring escort coverage.</p>
            </Link>
            <Link href="/reposition" className="group rounded-2xl bg-[#0b0c10] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors">
              <Navigation className="w-6 h-6 text-[#C6923A] mb-4" />
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#C6923A] transition-colors">Repositioning</h3>
              <p className="text-xs text-gray-500">Kill your deadhead miles. Find operators already heading your direction.</p>
            </Link>
            <Link href="/sponsor" className="group rounded-2xl bg-[#0b0c10] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl" />
              <Shield className="w-6 h-6 text-orange-500 mb-4" />
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">AdGrid Sponsorship</h3>
              <p className="text-xs text-gray-500">Dominate a corridor. Claim intent instantly with our AdGrid command OS.</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
