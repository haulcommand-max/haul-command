import { notFound } from "next/navigation";
import { ShieldCheck, Crosshair, Phone, Building, Info, ShieldAlert, Award, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CompanyData {
  usdot: string;
  legal_name: string;
  dba?: string;
  address: string;
  phone: string;
  entity_type: string;
  operating_status: string;
  safety_rating: "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";
  mcs150_date: string;
  driver_count: number;
  power_units: number;
  insurance_status: string;
}

function getMockCompanyMetrics(usdot: string): CompanyData | null {
  return {
    usdot,
    legal_name: "HEAVY HAUL COMMAND LOGISTICS LLC",
    dba: "HH Command Carriers",
    address: "1234 Freight Parkway, Dallas, TX 75201",
    phone: "(555) 019-2831",
    entity_type: "Carrier",
    operating_status: "AUTHORIZED",
    safety_rating: "Satisfactory",
    mcs150_date: "2025-11-14",
    driver_count: 42,
    power_units: 35,
    insurance_status: "Active (BIPD: $1,000,000+)",
  };
}

export default async function DotLookupResultPage({ params }: { params: { usdot: string } }) {
  const data = getMockCompanyMetrics(params.usdot);

  if (!data) {
    notFound();
  }

  const ratingColors = {
    Satisfactory: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    Conditional: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    Unsatisfactory: "bg-red-500/20 text-red-500 border-red-500/50",
    None: "bg-[#0A0A0A]0/20 text-slate-400 border-slate-500/50",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Entity Header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-24 pb-12">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">FMCSA Record</span>
                <span className="text-slate-500 text-sm font-medium">USDOT {data.usdot}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white">{data.legal_name}</h1>
              {data.dba && <p className="text-lg text-slate-400 mt-2">DBA: {data.dba}</p>}
            </div>
            <div className="flex gap-3">
              <Link href={`/claim/usdot/${data.usdot}`} className="inline-flex items-center justify-center bg-transparent border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 font-bold py-2 px-6 rounded-lg transition-colors">
                Is this your company? Claim Profile
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-500" />
              <span>{data.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <span>{data.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-slate-500" />
              <span>{data.entity_type}</span>
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-slate-400 text-sm font-medium mb-1">Operating Status</div>
                <div className="flex items-center gap-2">
                  {data.operating_status === "AUTHORIZED" ? (
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                  )}
                  <span className="text-2xl font-bold text-white">{data.operating_status}</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-slate-400 text-sm font-medium mb-1">Safety Rating</div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-md text-sm font-bold border ${ratingColors[data.safety_rating]}`}>
                    {data.safety_rating}
                  </span>
                  <span className="text-xs text-slate-500">as of Latest Audit</span>
                </div>
              </div>
            </div>

            {/* Fleet Info Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="border-b border-slate-800 bg-slate-800/30 p-4 font-bold flex flex-row items-center justify-between">
                <span>Fleet &amp; Operations Details</span>
                <Award className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <th className="font-medium text-slate-400 px-6 py-4 bg-slate-900/50 w-1/3">Power Units (Trucks)</th>
                      <td className="px-6 py-4 font-bold text-white">{data.power_units}</td>
                    </tr>
                    <tr>
                      <th className="font-medium text-slate-400 px-6 py-4 bg-slate-900/50">Driver Count</th>
                      <td className="px-6 py-4 text-white">{data.driver_count}</td>
                    </tr>
                    <tr>
                      <th className="font-medium text-slate-400 px-6 py-4 bg-slate-900/50">Insurance/BIPD</th>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          {data.insurance_status}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="font-medium text-slate-400 px-6 py-4 bg-slate-900/50">MCS-150 Date</th>
                      <td className="px-6 py-4 text-slate-300">{data.mcs150_date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-500/80 leading-relaxed">
                Data displayed here is sourced directly from the FMCSA SAFER database and public records. It may experience slight lag. Always verify active authority on the official FMCSA portal before dispatching a high-value heavy-haul load.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner CTA - Claim Pressure */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="h-32 w-32" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Take Control of Your Record</h3>
              <p className="text-sm text-slate-300 mb-6 relative z-10">
                Claim this USDOT number to unlock your Haul Command Company Profile, gain the verified shield, respond to reviews, and book direct loads.
              </p>
              <Link href={`/claim/usdot/${data.usdot}`} className="w-full inline-flex items-center justify-center bg-[#1E1E1E] hover:bg-[#121212] text-white font-bold py-2.5 px-4 rounded-lg transition-colors relative z-10">
                Claim Profile — It&apos;s Free
              </Link>
            </div>

            {/* Compliance AdGrid Placement */}
            <div className="bg-slate-900 border border-blue-900/30 p-6 rounded-xl relative group">
              <div className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-widest text-slate-600">Ad</div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <h4 className="font-bold text-white mb-2 leading-tight">Need a Carrier Risk Report?</h4>
              <p className="text-xs text-slate-400 mb-4">
                Generate an instant PDF risk assessment outlining previous DOT violations, crash volume, and compliance history.
              </p>
              <Link href="/tools/compliance-sentinel" className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center">
                Generate Report <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
