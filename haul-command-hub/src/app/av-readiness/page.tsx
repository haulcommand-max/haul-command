import Navbar from '@/components/Navbar';
import { Bot, MapPin, Activity, AlertTriangle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 900;

export default function AutonomousReadinessPage() {
  const ALERTS = [
    {
      id: "alert-1",
      corridor: "I-10 Texas to Florida",
      status: "Testing Active",
      riskLevel: "Medium",
      details: "Kodiak Robotics running level 4 autonomous freight. Pilot cars required for oversized escorts due to sensor disruption risk.",
      time: "2 hours ago"
    },
    {
      id: "alert-2",
      corridor: "I-45 Houston-Dallas",
      status: "Commercial Deployment",
      riskLevel: "High",
      details: "Aurora Innovation commercial runs active. Recommended 2-mile spacing for superloads.",
      time: "5 hours ago"
    },
    {
      id: "alert-3",
      corridor: "I-80 Wyoming",
      status: "Winter Testing",
      riskLevel: "Low",
      details: "Autonomous testing paused due to chain law requirements.",
      time: "1 day ago"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <Navbar />
      
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
                AV <span className="text-accent">Readiness</span>
              </h1>
            </div>
          </div>
          <p className="text-[#b0b0b0] text-base sm:text-lg max-w-2xl">
            Live intelligence on autonomous vehicle freight corridors. Track where robotic fleets are operating to de-risk your heavy haul routing.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Activity className="text-red-500 w-5 h-5 animate-pulse" />
              Live Autonomous Alert Feed
            </h2>
            
            {ALERTS.map((alert) => (
              <div key={alert.id} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-accent/30 transition-colors">
                <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-gray-400 w-4 h-4" />
                    <span className="font-bold text-white text-lg">{alert.corridor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${alert.status.includes('Active') || alert.status.includes('Commercial') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                      {alert.status}
                    </span>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {alert.details}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-black/40 px-3 py-2 rounded-lg w-fit border border-white/5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${alert.riskLevel === 'High' ? 'text-red-400' : alert.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  Haul Disruption Risk: <span className={alert.riskLevel === 'High' ? 'text-red-400' : alert.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-gray-400'}>{alert.riskLevel}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white/[0.05] to-black border border-white/[0.08] rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-2">Sell Your Telematics</h3>
              <p className="text-sm text-gray-400 mb-4">
                Autonomous freight networks rely on real-world edge cases. Opt into our Data Monetization pipeline to sell your superload movement data.
              </p>
              <Link href="/data-monetization" className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-black font-bold rounded-xl hover:bg-yellow-500 transition-colors">
                Enable Data Tracking <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">AV Test States</h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Texas</span>
                  <span className="text-red-400 font-bold text-xs uppercase bg-red-400/10 px-2 py-0.5 rounded">High Activity</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Arizona</span>
                  <span className="text-red-400 font-bold text-xs uppercase bg-red-400/10 px-2 py-0.5 rounded">High Activity</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">California</span>
                  <span className="text-yellow-400 font-bold text-xs uppercase bg-yellow-400/10 px-2 py-0.5 rounded">Testing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
