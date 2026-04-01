import Link from 'next/link';

export default function GeographicProximityFooter({ currentCounty, nearbyCounties }: { currentCounty: string; nearbyCounties: string[] }) {
  if (!nearbyCounties || nearbyCounties.length === 0) return null;

  return (
    <div className="border-t border-gray-800 pt-8 mt-12 pb-12">
      <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Nearby Escort Service Regions</h4>
      <div className="flex flex-wrap gap-3">
        {nearbyCounties.map(county => (
          <Link key={county} href={`/directory/us/tx/${county.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-md text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
            {county} Pilot Cars
          </Link>
        ))}
      </div>
    </div>
  );
}
