import React from "react";

// Haul Command: Operator Report Card & Trust Points Module
// This is the visible manifestation of the Gamified UGC logic. Operators check this
// to confirm their rank and trust points.

interface ReportCardProps {
  score: number;
  rank: number;
  postCount: number;
  region: string;
}

export default function OperatorReportCard({ score, rank, postCount, region }: ReportCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl mt-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 flex justify-between items-center border-b border-gray-700">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Haul Command Report Card</h2>
          <p className="text-xs text-yellow-500 font-mono uppercase mt-1">Verified Escort Output</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{score} <span className="text-sm font-medium text-gray-400">TP</span></div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total Trust Points</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 bg-[#0a0a0a]">
        
        {/* RANK */}
        <div className="p-6 text-center hover:bg-gray-800/50 transition">
          <div className="text-yellow-500 text-3xl font-black">#{rank}</div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mt-2">{region} Corridor Rank</div>
        </div>

        {/* UGC CONTRIBUTIONS */}
        <div className="p-6 text-center hover:bg-gray-800/50 transition">
          <div className="text-white text-3xl font-black">{postCount}</div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mt-2">Hazard Reports</div>
          <div className="text-[10px] text-green-500 font-mono mt-1">+{(postCount * 10)} Score Gained</div>
        </div>

        {/* ALGORITHM BIAS */}
        <div className="p-6 text-center hover:bg-gray-800/50 transition">
          <div className="text-white text-3xl font-black">HIGH</div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mt-2">Broker Routing Bias</div>
          <div className="text-[10px] text-blue-400 font-mono mt-1">Priority Selection Active</div>
        </div>

      </div>

      {/* Gamification Upsell / Action Area */}
      <div className="p-6 bg-gray-900 flex justify-between items-center">
         <div>
            <p className="text-sm text-gray-300">Your profile is currently <span className="font-bold text-white">visible to 85% of brokers</span> in {region}.</p>
            <p className="text-xs text-gray-500 mt-1">Submit 3 more hazard reports to unlock Priority Routing Bias.</p>
         </div>
         <button className="bg-yellow-500 text-black font-black text-xs px-6 py-2 uppercase rounded hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            Report 10-Point Hazard
         </button>
      </div>

    </div>
  );
}
