import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { MapPin, Calendar, DollarSign, Clock, ShieldCheck, Mail, ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assignment Tracking — Broker Dashboard",
  robots: { index: false, follow: false },
};

export default async function BrokerAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/broker/assignments/" + id);

  const { data: assignment, error } = await supabase
    .from("dispatch_assignments")
    .select(`
      *,
      operator:operator_user_id (
        id,
        email,
        raw_user_meta_data
      ),
      load:hc_loads (
        id,
        commodity,
        width_ft,
        height_ft,
        length_ft,
        weight_lbs,
        notes
      ),
      operator_profile:hc_global_operators (
        business_name,
        phone,
        rating_avg,
        review_count
      )
    `)
    .eq("id", id)
    .single();

  if (error || !assignment) {
    if (error) console.error("Assignment detail error:", error.message);
    return notFound();
  }

  // Ensure this broker actually owns the assignment
  if (assignment.broker_user_id !== user.id) {
    return notFound();
  }

  const opMeta = assignment.operator?.raw_user_meta_data || {};
  let opName = assignment.operator_profile?.business_name || opMeta.business_name || opMeta.full_name || assignment.operator?.email;

  // Handle case where operator_profile is an array (should be single but just in case of DB anomaly)
  if (Array.isArray(assignment.operator_profile) && assignment.operator_profile.length > 0) {
    opName = assignment.operator_profile[0].business_name || opName;
  }

  const isActive = assignment.status === "active" || assignment.status === "in_transit";
  const isCompleted = assignment.status === "completed";
  const isInTransit = assignment.status === "in_transit";

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/dashboard/broker/loads" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Load Board
        </Link>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-widest ${
                isInTransit
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : isActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCompleted 
                      ? 'bg-slate-700/50 border-slate-600 text-slate-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {assignment.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {assignment.id.substring(0,8)}</span>
            </div>
            <h1 className="text-3xl font-black text-white">{assignment.load_type || "Oversize Load"}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" /> Escrow Authorized
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-right self-stretch flex flex-col justify-center">
            <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wide">Agreed Rate</p>
            <p className="text-2xl font-black text-gold">${assignment.agreed_rate_per_day} <span className="text-sm text-slate-500 font-normal">/ day</span></p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Live Status Tracker */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Status Tracker</h2>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                {isInTransit ? (
                  <div className="flex items-center gap-3 text-blue-400">
                     <Truck className="w-6 h-6 animate-pulse" />
                     <div>
                       <p className="font-bold">Operator is In Transit</p>
                       <p className="text-xs text-slate-400">The operator has confirmed they are on the route.</p>
                     </div>
                  </div>
                ) : isCompleted ? (
                  <div className="flex items-center gap-3 text-slate-300">
                     <CheckCircle className="w-6 h-6 text-emerald-500" />
                     <div>
                       <p className="font-bold">Route Completed</p>
                       <p className="text-xs text-slate-400">The operator marked this route as complete.</p>
                     </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-emerald-400">
                     <ShieldCheck className="w-6 h-6" />
                     <div>
                       <p className="font-bold">Operator Assigned</p>
                       <p className="text-xs text-slate-400">Waiting for operator to begin route.</p>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Route Details */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Route Details</h2>
              <div className="flex flex-col gap-6 relative">
                {/* Connecting Line */}
                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-800 hidden sm:block"></div>
                
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Origin</h3>
                    <p className="text-lg font-semibold text-white">{assignment.origin}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</h3>
                    <p className="text-lg font-semibold text-white">{assignment.destination}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date Needed</h3>
                  <p className="font-semibold text-slate-200">{assignment.date_needed || "ASAP"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Accepted At</h3>
                  <p className="font-semibold text-slate-200">{new Date(assignment.accepted_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Load Specs */}
            {assignment.load && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Load Details</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                   <div className="bg-slate-800 px-3 py-2 rounded">
                     <span className="text-xs text-slate-400 block mb-0.5">Commodity</span>
                     <span className="font-semibold">{assignment.load.commodity || "N/A"}</span>
                   </div>
                   <div className="bg-slate-800 px-3 py-2 rounded">
                     <span className="text-xs text-slate-400 block mb-0.5">Width</span>
                     <span className="font-semibold">{assignment.load.width_ft || "?"} ft</span>
                   </div>
                   <div className="bg-slate-800 px-3 py-2 rounded">
                     <span className="text-xs text-slate-400 block mb-0.5">Height</span>
                     <span className="font-semibold">{assignment.load.height_ft || "?"} ft</span>
                   </div>
                   <div className="bg-slate-800 px-3 py-2 rounded">
                     <span className="text-xs text-slate-400 block mb-0.5">Weight</span>
                     <span className="font-semibold">{assignment.load.weight_lbs || "?"} lbs</span>
                   </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl sticky top-24">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">The Operator</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-400 border border-slate-700">
                  {opName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white">{opName}</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3 h-3" /> Assigned</p>
                </div>
              </div>

              <a 
                href={`mailto:${assignment.operator?.email}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2 text-sm font-semibold transition bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:border-blue-500/50"
              >
                <Mail className="w-4 h-4" /> Contact Operator
              </a>

              <hr className="border-slate-800 my-5" />
              
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Escrow Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Escrow Held</span>
                  <span className="font-semibold text-emerald-400">Authorized</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Charge</span>
                  <span className="font-semibold">${assignment.agreed_rate_per_day + assignment.platform_fee_usd}</span>
                </div>
              </div>
              
              <div className="bg-slate-950 p-3 rounded text-xs text-slate-400 leading-relaxed border border-slate-800">
                Your payment is currently held securely in escrow. When the route is complete, release the funds to the operator.
              </div>
              
              {isCompleted && (
                <div className="mt-6 flex flex-col gap-2">
                  <Button aria-label="Release Escrow" className="w-full bg-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-lg shadow-lg">
                    Release Escrow Payout
                  </Button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Added empty CheckCircle icon for the status tracker that wasn't imported
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
