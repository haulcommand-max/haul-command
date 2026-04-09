'use client';

export default function SubscriptionUpsellMatrix() {
  return (
    <div className="grid md:grid-cols-2 gap-6 my-8">
      <div className="p-6 border border-gray-800 rounded-xl bg-gray-900">
        <h3 className="text-xl font-bold text-gray-300">Free Tier</h3>
        <h4 className="text-3xl font-black text-white my-4">$0 <span className="text-sm text-gray-500 font-normal">/mo</span></h4>
        <ul className="space-y-3 text-sm text-gray-400 mb-6">
          <li>✓ Standard Market Map</li>
          <li>✓ 15-Minute Alert Delay</li>
          <li>✓ Standard Profile Visibility</li>
        </ul>
        <button disabled className="w-full py-2 bg-gray-800 text-gray-400 rounded cursor-not-allowed">Current Plan</button>
      </div>

      <div className="p-6 border-2 border-yellow-500 rounded-xl bg-gradient-to-b from-yellow-900/20 to-black relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">Most Popular</div>
        <h3 className="text-xl font-bold text-yellow-500">Premium OS</h3>
        <h4 className="text-3xl font-black text-white my-4">$29 <span className="text-sm text-gray-500 font-normal">/mo</span></h4>
        <ul className="space-y-3 text-sm text-gray-300 mb-6 font-medium">
          <li>⚡ Zero-Latency Instant Load Alerts</li>
          <li>⭐ Unfettered Escort Scarcity Analytics</li>
          <li>🏆 Featured Directory Placement</li>
          <li>📊 Competitor Market Intel</li>
        </ul>
        <button className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded transition-colors shadow-lg shadow-yellow-900/30">Upgrade to Premium</button>
      </div>
    </div>
  );
}
