import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Pilot Car Compliance & Form Kit | Haul Command',
  description: 'Download the complete $149 value Pilot Car Compliance Kit for free. Includes standard operating procedures, independent contractor agreements, W-9s, and high-visibility checklists.',
  alternates: {
    canonical: 'https://haulcommand.com/compliance-kit'
  }
};

const FORMS = [
  { title: "Standard Operating Procedures (SOP)", desc: "15-page best practice guide for route execution and safety." },
  { title: "Master Service Agreement", desc: "Protect yourself when contracting with brokers and carriers." },
  { title: "Incident Report Template", desc: "Insurance-ready template for reporting en-route incidents." },
  { title: "Pre-Trip Inspection Checklist", desc: "Essential daily logs for height poles, beacons, and comms." },
  { title: "W-9 & Tax Structure Guide", desc: "Standard 1099 independent contractor IRS forms and overview." },
  { title: "Professional Invoice Generator", desc: "Plug-and-play spreadsheet to guarantee faster net-30 payouts." }
];

export default function ComplianceKitPage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      <section className="py-20 px-4 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full" />
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full mb-6 border border-amber-500/20 uppercase tracking-widest">
            Made Obsolete: Competitor $149 Packages
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            The Complete Pilot Car <br /><span className="text-gray-500">Compliance Kit</span>
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mb-10">
            Other companies charge $149+ for these standard business forms. We are open-sourcing the entire structural baseline of the heavy haul industry for free.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/signup?redirect=/dashboard/compliance" 
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]"
            >
              Download the Full Kit (Free)
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FORMS.map((form, i) => (
              <div key={i} className="bg-[#0a0f16] border border-white/5 p-6 rounded-2xl hover:border-amber-500/20 transition-colors group">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-500/10 transition-colors">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">{form.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{form.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-amber-500 text-black text-center">
         <div className="max-w-3xl mx-auto">
             <h2 className="text-3xl font-black mb-4">Stop Paying For Basic Documents.</h2>
             <p className="text-lg font-medium opacity-80 mb-8">
                Haul Command is the new operating system for the escort vehicle ecosystem. Stop paying vanity sites for Word documents. 
             </p>
             <Link href="/dashboard" className="px-8 py-4 bg-black text-white hover:bg-gray-900 font-bold rounded-xl transition-colors">
                Enter Haul Command
             </Link>
         </div>
      </section>
    </div>
  );
}
