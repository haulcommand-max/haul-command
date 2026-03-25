import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Live Superload Alerts & Route Closures | Haul Command',
  description: 'Track massive superload movements, active route surveys, and emergency highway closures related to oversize freight operations.',
  alternates: {
    canonical: 'https://haulcommand.com/tools/superload-alerts',
  }
};

export default function SuperloadAlertsPage() {
  const dummyAlerts = [
    {
      id: "SA-001",
      corridor: "I-10 E / Houston Metro",
      status: "ACTIVE MOVEMENT",
      description: "250,000 LB Transformer Move. Two lane closure actively rolling.",
      timestamp: "10 mins ago",
      impact: "High",
      type: "superload"
    },
    {
      id: "SA-002",
      corridor: "I-40 W / Flagstaff to Kingman",
      status: "SCHEDULED NIGHT MOVEMENT",
      description: "Wind Turbine Blade transport (180ft). Expected speeds < 25mph on inclines.",
      timestamp: "Updated 2 hrs ago",
      impact: "Medium",
      type: "scheduled"
    },
    {
      id: "SA-003",
      corridor: "US-281 N / San Antonio",
      status: "CLEARED",
      description: "16ft wide modular building move has cleared the construction zone.",
      timestamp: "Updated 4 hrs ago",
      impact: "Low",
      type: "cleared"
    }
  ];

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[80px] sm:pt-[100px] px-4 pb-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
              Superload <span className="text-accent underline decoration-[6px] underline-offset-4">Alerts</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Live telemetry feed mapping high-impact massive transport operations, closures, and dispatch warnings.
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm max-w-5xl mx-auto overflow-hidden">
            <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                 Live Operations Feed
               </h2>
               <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/10 text-xs font-bold rounded hover:bg-white border border-white/20 transition-colors uppercase tracking-widest text-white hover:text-black">Filter by Area</button>
               </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {dummyAlerts.map(alert => (
                <div key={alert.id} className="p-6 md:p-8 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest ${
                        alert.type === 'superload' ? 'bg-red-500 text-white' : 
                        alert.type === 'scheduled' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}>
                        {alert.status}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">{alert.timestamp}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{alert.corridor}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{alert.description}</p>
                  </div>

                  <div className="flex shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <button className="w-full md:w-auto px-6 py-3 bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/10 rounded-lg text-sm font-bold transition-all text-white">
                      View Map Intel ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
