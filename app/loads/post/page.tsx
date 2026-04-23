import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Post an Oversize Load | Haul Command Load Board',
  description: 'Post your oversize or heavy haul load to reach 7,711+ verified pilot car operators and escort vehicles across 120 countries.',
};

export default function PostLoadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/loads" className="text-xs text-[#C6923A] font-semibold hover:underline">← Load Board</Link>
          <h1 className="text-3xl font-black text-gray-900 mt-3 mb-2">Post an Oversize Load</h1>
          <p className="text-gray-500">Reach 7,711+ verified pilot car operators. Your load will appear in relevant escort searches and corridor feeds.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-sm text-gray-500 mb-6 p-4 bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-xl">
            🚀 <strong>Load board posting</strong> — Create a Haul Command account to post loads, manage bids, and track escort matching.
          </p>

          <div className="space-y-5">
            {[
              { label: 'Origin City, State', placeholder: 'e.g. Houston, TX', name: 'origin' },
              { label: 'Destination City, State', placeholder: 'e.g. New Orleans, LA', name: 'destination' },
              { label: 'Load Type', placeholder: 'e.g. Wind turbine tower, industrial equipment', name: 'load_type' },
              { label: 'Estimated Move Date', placeholder: 'MM/DD/YYYY', name: 'move_date', type: 'date' },
              { label: 'Escorts Required', placeholder: 'e.g. 2 pilot cars, 1 height pole', name: 'escorts' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                <input type={field.type ?? 'text'} name={field.name} placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F1A91B] focus:ring-2 focus:ring-[#F1A91B]/20 transition-all" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/login?redirect=/loads/post"
              className="flex-1 text-center px-6 py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-xl transition-colors text-sm">
              Sign In to Post Load
            </Link>
            <Link href="/register?redirect=/loads/post"
              className="flex-1 text-center px-6 py-3 bg-[#0B0F14] hover:bg-[#1a2332] text-white font-bold rounded-xl transition-colors text-sm">
              Create Free Account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Already have an escort lined up?{' '}
          <Link href="/directory" className="text-[#C6923A] hover:underline">Browse the directory instead →</Link>
        </div>
      </div>
    </div>
  );
}
