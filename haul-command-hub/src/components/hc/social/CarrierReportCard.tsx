import { ShieldCheck, Award, Target, Activity, AlertOctagon } from 'lucide-react';

interface ReportCardProps {
  entityType: string;
  claimStatus: string;
}

export function CarrierReportCard({ entityType, claimStatus }: ReportCardProps) {
  // In production, this pulls dynamically from hc_performance_metrics or peer reviews
  const isClaimed = claimStatus === 'claimed';
  const trustScore = isClaimed ? 94 : 62;
  const reliability = isClaimed ? 98 : 70;
  const jobsCompleted = isClaimed ? 142 : 12;

  // Dynamic color calculation for the massive visual score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBorderColor = (score: number) => {
    if (score >= 90) return 'border-green-500/20 bg-green-500/5';
    if (score >= 70) return 'border-yellow-500/20 bg-yellow-500/5';
    return 'border-red-500/20 bg-red-500/5';
  };

  return (
    <section className="mb-10 mt-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <ShieldCheck className={isClaimed ? "text-hc-gold" : "text-gray-500"} />
          Operational Report Card
        </h2>
        <span className="text-xs font-bold font-mono text-gray-500 tracking-widest uppercase bg-white/5 px-2 py-1 rounded">Rolling 90 Days</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Massive Trust Score */}
        <div className={`p-6 rounded-2xl border ${getBorderColor(trustScore)} flex flex-col items-center justify-center text-center`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Trust Score</p>
          <h3 className={`text-6xl font-black font-mono tracking-tighter ${getScoreColor(trustScore)}`}>
            {trustScore}
          </h3>
          {isClaimed ? (
             <p className="text-xs text-green-500/80 font-medium mt-2 flex items-center gap-1"><ShieldCheck size={12}/> Top 5% Regional</p>
          ) : (
             <p className="text-xs text-amber-500/80 font-medium mt-2 flex items-center gap-1"><AlertOctagon size={12}/> Unverified Profile</p>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Dispatch Reliability</p>
              <Activity size={16} className={isClaimed ? "text-blue-400" : "text-gray-600"} />
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-4xl font-black text-white">{reliability}<span className="text-xl text-gray-500">%</span></h4>
            </div>
            <p className="text-xs text-gray-500 mt-2">On-time adherence to MSR</p>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Verified Hauls</p>
              <Target size={16} className={isClaimed ? "text-purple-400" : "text-gray-600"} />
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-4xl font-black text-white">{jobsCompleted}</h4>
            </div>
            <p className="text-xs text-gray-500 mt-2">Confirmed via load board</p>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Network Rank</p>
              <Award size={16} className={isClaimed ? "text-hc-gold" : "text-gray-600"} />
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-white">{isClaimed ? 'Tier 1' : 'Unranked'}</h4>
            </div>
            <p className="text-xs text-gray-500 mt-2">Algorithmic network standing</p>
          </div>

        </div>
      </div>
    </section>
  );
}
