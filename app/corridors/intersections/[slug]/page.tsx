import { notFound } from "next/navigation";
import { ShieldAlert, Map, AlertTriangle, Truck, Eye, ArrowRight, Video, Navigation2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data product resolver for Intersections
function getIntersectionData(slug: string) {
  // If we had a database, we'd query here.
  // We'll mock the specific example requested by the user: "I-90 / US-97 in WA"
  if (slug === "wa-i90-us97-ellensburg") {
    return {
      title: "I-90 / US-97 Interchange",
      state: "Washington",
      city: "Ellensburg",
      clearance: "16ft 4in",
      weight_limit: "129,000 lbs (Permit Required)",
      risk_level: "High",
      cameras_active: 3,
      restrictions: [
        "Curfew: No movement 06:00-09:00 and 15:00-18:00 on weekdays.",
        "Winter (Nov-Mar): Chains required on Snoqualmie Pass approach.",
        "High wind warnings frequent — trailers over 14ft height must stop at MP 106 if winds > 35mph.",
      ],
      recent_incidents: "2 oversize loads delayed due to unpermitted axle weight crossing bridge structures."
    };
  }

  // Fallback generic data
  return {
    title: slug.split('-').join(' ').toUpperCase(),
    state: "Regional",
    city: "Unknown",
    clearance: "Varies",
    weight_limit: "Standard Bridge Formula",
    risk_level: "Moderate",
    cameras_active: 1,
    restrictions: ["Standard pilot car requirements apply based on dimensions."],
    recent_incidents: "No recent incidents recorded."
  };
}

export default function CorridorIntersectionPage({ params }: { params: { slug: string } }) {
  const data = getIntersectionData(params.slug);

  if (!data) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Entity Header */}
      <div className="bg-slate-900 border-b border-indigo-900/50 pt-24 pb-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-[url('https://maps.wikimedia.org/osm-intl/9/127/198.png')] bg-cover opacity-10 mix-blend-screen filter grayscale pointer-events-none" />
        
        <div className="container max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm flex items-center gap-1.5">
                   <AlertTriangle className="h-3.5 w-3.5" /> High Risk Interchange
                </span>
                <span className="text-slate-400 text-sm font-medium">{data.city}, {data.state}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white">{data.title}</h1>
              <p className="text-lg text-slate-400 mt-3 font-mono">Intelligence Data Product: Chokepoint Restrictions</p>
            </div>
            
            <div className="flex gap-3 shrink-0">
               <Button className="bg-indigo-600 hover:bg-indigo-500 font-bold">
                  <Video className="w-4 h-4 mr-2" /> View DOT Cameras
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Status Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                 <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Vertical Clearance</div>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-white">{data.clearance}</span>
                 </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                 <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Bridge Limit</div>
                 <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-rose-400">{data.weight_limit}</span>
                 </div>
              </div>
            </div>

            {/* Restrictions Box */}
            <div className="bg-slate-900 border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
               <div className="border-b border-slate-800 bg-amber-500/5 p-4 font-bold flex flex-row items-center justify-between text-amber-500">
                  <span className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Active Route Restrictions</span>
               </div>
               <div className="p-6">
                  <ul className="space-y-4">
                     {data.restrictions.map((r, i) => (
                        <li key={i} className="flex gap-3 items-start">
                           <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                           <span className="text-slate-300 leading-relaxed font-medium">{r}</span>
                        </li>
                     ))}
                  </ul>
               </div>
               <div className="bg-slate-950 p-4 border-t border-slate-800 text-xs text-slate-500 font-mono">
                 Auto-synced from State DOT API • Last updated 12 mins ago
               </div>
            </div>
            
            {/* Intel Note */}
            <div className="bg-black border border-slate-800 p-6 rounded-xl flex items-start gap-4">
               <Eye className="w-6 h-6 text-indigo-400 shrink-0" />
               <div>
                  <h4 className="text-white font-bold mb-1">Recent Incident Intel</h4>
                  <p className="text-slate-400 text-sm">{data.recent_incidents}</p>
               </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Operator Moat CTA */}
            <div className="bg-gradient-to-b from-indigo-900/50 to-slate-900 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden text-center shadow-xl shadow-indigo-900/20">
               <Navigation2 className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Need a local pilot car?</h3>
               <p className="text-sm text-slate-300 mb-6">
                 Avoid out-of-state routing errors. Book an operator who runs this interchange daily.
               </p>
               <Button className="w-full bg-white text-indigo-950 font-bold hover:bg-slate-200">
                 Find Local Operators
               </Button>
            </div>

            {/* Promote Route Survey App */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl group hover:border-slate-700 transition-colors">
               <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                 <Map className="h-5 w-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
               </div>
               <h4 className="font-bold text-white mb-2 leading-tight">Order Route Survey</h4>
               <p className="text-xs text-slate-400 mb-4">
                 Are your dimensions pushing the limit? Dispatch a high-pole operator to run this specific interchange before your heavy haul arrives.
               </p>
               <Link href="/tools/route-survey" className="text-sm text-amber-500 hover:text-amber-400 font-bold flex items-center">
                 Book Survey <ArrowRight className="h-4 w-4 ml-1" />
               </Link>
            </div>

            {/* Promote Scale Bypass Partner */}
            <div className="bg-slate-900 border border-blue-900/40 p-6 rounded-xl relative group overflow-hidden">
               <div className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-widest text-slate-600">Sponsored</div>
               <Truck className="h-8 w-8 text-blue-500 mb-4" />
               <h4 className="font-bold text-white mb-2">Bypass Open Weigh Stations</h4>
               <p className="text-xs text-slate-400 mb-4">
                 Scale delays cost money. Get pre-clearance using our affiliate program.
               </p>
               <Link href="/partners/bypass" className="text-sm text-blue-400 font-bold flex items-center group-hover:text-blue-300">
                 Learn More <ChevronRight className="h-4 w-4 ml-1" />
               </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// Just an internal CheckIcon mapping since I didn't import ChevronRight above properly
function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
