export default function EarningsRecapDashboard({ monthlyTotal, marketAvg }: { monthlyTotal: number, marketAvg: number }) {
  const percentDiff = ((monthlyTotal - marketAvg) / marketAvg) * 100;
  const isAbove = percentDiff >= 0;

  return (
    <div className="bg-gradient-to-br from-[#111] to-[#050505] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">This Month</div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Your Wrapped Performance</h2>
      
      <div className="mt-6 mb-8">
        <h3 className="text-4xl font-black text-white">${monthlyTotal.toLocaleString()}</h3>
        <p className={`text-sm font-bold mt-2 flex items-center gap-1 ${isAbove ? 'text-green-400' : 'text-red-400'}`}>
          {isAbove ? '↑' : '↓'} {Math.abs(percentDiff).toFixed(1)}% {isAbove ? 'above' : 'below'} market average
        </p>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-yellow-500 h-2.5 rounded-full" 
          style={{ width: `${Math.min(100, (monthlyTotal / (marketAvg * 1.5)) * 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 font-bold mt-2">
        <span>$0</span>
        <span>Market Avg: ${marketAvg.toLocaleString()}</span>
      </div>
    </div>
  );
}
