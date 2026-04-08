import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { MapPin, Calendar, DollarSign, Clock, ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AssignmentActions } from "./AssignmentActions";
import { QuickPayWidget } from "@/components/quickpay/QuickPayWidget";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assignment Details — Operator Dashboard",
  robots: { index: false, follow: false },
};

export default async function OperatorAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/operator/assignments/" + id);

  const { data: assignment, error } = await supabase
    .from("dispatch_assignments")
    .select(`
      *,
      broker:broker_user_id (
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
      )
    `)
    .eq("id", id)
    .single();

  if (error || !assignment) {
    if (error) console.error("Assignment detail error:", error.message);
    return notFound();
  }

  // Ensure this operator actually owns the assignment
  if (assignment.operator_user_id !== user.id) {
    return notFound();
  }

  const brokerMeta = assignment.broker?.raw_user_meta_data || {};
  const businessName = brokerMeta.business_name || brokerMeta.company_name || assignment.broker?.email;

  const isActive = assignment.status === "active" || assignment.status === "in_transit";
  const isCompleted = assignment.status === "completed";

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/dashboard/operator" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-widest ${
                isActive 
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
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Managed via Haul Command Escrow
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
                {assignment.load.notes && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Broker Notes</span>
                    <p className="text-sm text-slate-300 p-3 bg-slate-950 rounded border border-slate-800">{assignment.load.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Required Equipment */}
            {(assignment.positions?.length > 0) && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Requested Service</h2>
                <div className="flex flex-wrap gap-2">
                  {assignment.positions.map((pos: string) => (
                    <span key={pos} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-sm font-semibold">
                      {pos}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl sticky top-24">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">The Broker</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-400 border border-slate-700">
                  {businessName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white">{businessName}</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3 h-3" /> Verified Broker</p>
                </div>
              </div>

              <a 
                href={`mailto:${assignment.broker?.email}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2 text-sm font-semibold transition bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:border-blue-500/50"
              >
                <Mail className="w-4 h-4" /> Contact Broker
              </a>

              <hr className="border-slate-800 my-5" />
              
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Escrow Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-emerald-400">Authorized</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Daily Rate</span>
                  <span className="font-semibold">${assignment.agreed_rate_per_day}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Platform Fee</span>
                  <span className="font-semibold text-rose-400">-{assignment.platform_fee_pct}% (${assignment.platform_fee_usd})</span>
                </div>
              </div>
              
              <div className="bg-slate-950 p-3 rounded text-xs text-slate-400 leading-relaxed border border-slate-800">
                The broker's payment is held securely in escrow. Payouts are released automatically when delivery is confirmed.
              </div>

              {/* QuickPay — show for completed assignments with a rate */}
              {isCompleted && assignment.agreed_rate_per_day > 0 && (
                <div className="mt-4">
                  <QuickPayWidget
                    jobId={assignment.id}
                    grossAmount={assignment.agreed_rate_per_day}
                    eligibilityStatus="eligible"
                  />
                </div>
              )}

              {/* Active Milestone Actions */}
              {(isActive || assignment.status === "in_transit") && (
                <AssignmentActions 
                  assignmentId={assignment.id} 
                  currentStatus={assignment.status} 
                />
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
