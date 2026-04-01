'use client';

export default function SelfServeAdBuyer() {
  return (
    <div className="max-w-2xl mx-auto p-8 mt-12 border border-gray-800 rounded-2xl bg-[#0a0a0c]">
      <h2 className="text-2xl font-bold text-white mb-2">Buy Ad Placement</h2>
      <p className="text-gray-400 text-sm mb-6">Instantly dominate the {`{State}`} pilot car directory with a sponsored leaderboard ad.</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Directory</label>
          <select className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white">
            <option>Texas (High Volume)</option>
            <option>Florida (High Volume)</option>
            <option>Pennsylvania</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Banner (728x90)</label>
          <div className="border border-dashed border-gray-700 bg-black/50 rounded-lg p-10 text-center text-gray-500 hover:border-yellow-500 hover:text-yellow-500 transition-colors cursor-pointer">
            + Click to Upload Media
          </div>
        </div>

        <button className="w-full bg-white text-black font-bold text-sm py-3 rounded-lg mt-8 shadow-xl shadow-white/10 hover:bg-gray-200 transition-colors">
          Checkout via Stripe ($50/week)
        </button>
      </div>
    </div>
  );
}
