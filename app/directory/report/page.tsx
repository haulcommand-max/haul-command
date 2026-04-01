import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import { ReportForm } from './ReportForm';

export const metadata: Metadata = {
  title: 'Report Incorrect Listing Data | Haul Command',
  description: 'Submit a correction for outdated or inaccurate logistics data on Haul Command.',
};

export default function ReportIncorrectDataPage({ searchParams }: { searchParams: { slug?: string } }) {
  const { slug } = searchParams;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-center mb-2 text-white">Report Inaccurate Data</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Haul Command ingests data from thousands of sources. If you found a listing with outdated or incorrect operational data, please report it to our trust and safety team.
        </p>

        {slug && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-center text-sm text-gray-400">
            Reporting entity: <span className="font-bold text-white">{slug}</span>
          </div>
        )}

        <ReportForm slug={slug} />

        <div className="mt-8 pt-6 border-t border-white/10 text-center flex flex-col items-center gap-2">
           <h3 className="font-bold text-sm text-white">Is this your business?</h3>
           <p className="text-xs text-gray-500 px-4">Instead of reporting, you can claim this profile to correct the data instantly and take control.</p>
           <Link href={`/claim${slug ? `?claim_id=${slug}` : ''}`} className="text-amber-500 hover:text-amber-400 text-sm font-bold mt-1">Claim Profile Now →</Link>
        </div>
      </div>
    </div>
  );
}
