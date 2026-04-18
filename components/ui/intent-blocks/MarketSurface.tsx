import React from "react";
import Link from "next/link";

export interface MarketSurfaceProps {
  subjectContext: string;
  marketData: {
    supplyStatus: "tight" | "balanced" | "surplus";
    topOperators: Array<{
      id: string;
      name: string;
      rating: number;
    }>;
  };
}

export function MarketSurface({ subjectContext, marketData }: MarketSurfaceProps) {
  const isTight = marketData.supplyStatus === "tight";

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl relative overflow-hidden">
       {/* Background Heat Map visual */}
       <div className={`absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full blur-3xl opacity-20 ${isTight ? "bg-red-500" : "bg-green-500"}`}></div>

       <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
             <div>
                <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-1">Local Density Proof</h3>
                <h2 className="text-2xl font-black text-white">{subjectContext}</h2>
             </div>
             <div className="text-right">
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${isTight ? "bg-red-900/50 text-red-500" : "bg-green-900/50 text-green-500"}`}>
                   Market: {marketData.supplyStatus}
                </span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {marketData.topOperators.map(op => (
                <div key={op.id} className="bg-gray-800/80 p-4 rounded border border-gray-700 hover:border-yellow-500/50 transition cursor-pointer group">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white group-hover:text-yellow-500 transition">{op.name}</span>
                      <span className="text-yellow-500 text-xs">⭐ {op.rating}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span>
                       <span className="text-xs text-gray-400">Available</span>
                   </div>
                </div>
             ))}
          </div>
          
          <div className="mt-6 text-center">
             <Link href="/directory" className="text-xs font-mono text-yellow-500 hover:text-white uppercase">
                 View All Verified Providers →
             </Link>
          </div>
       </div>
    </div>
  );
}
