import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const COUNTRY_DATA: Record<string, {
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  avgRate: string;
  regions: { code: string; name: string; avgRate: string }[];
  loadTypes: { type: string; rate: string }[];
}> = {
  us: {
    name: 'United States', flag: '\ud83c\uddfa\ud83c\uddf8', currency: 'USD', symbol: '$', avgRate: '450-650',
    regions: [
      { code: 'tx', name: 'Texas', avgRate: '500-700' },
      { code: 'ca', name: 'California', avgRate: '550-750' },
      { code: 'fl', name: 'Florida', avgRate: '450-600' },
      { code: 'pa', name: 'Pennsylvania', avgRate: '475-625' },
      { code: 'oh', name: 'Ohio', avgRate: '425-575' },
      { code: 'ga', name: 'Georgia', avgRate: '450-600' },
      { code: 'il', name: 'Illinois', avgRate: '475-650' },
      { code: 'ny', name: 'New York', avgRate: '500-700' },
    ],
    loadTypes: [
      { type: 'Wide Load', rate: '$500-700/day' },
      { type: 'Oversize', rate: '$450-650/day' },
      { type: 'Wind Blade', rate: '$600-900/day' },
      { type: 'Height Pole', rate: '$400-550/day' },
      { type: 'Route Survey', rate: '$350-500/day' },
    ],
  },
  ca: {
    name: 'Canada', flag: '\ud83c\udde8\ud83c\udde6', currency: 'CAD', symbol: 'C$', avgRate: '500-700',
    regions: [
      { code: 'ab', name: 'Alberta', avgRate: '550-750' },
      { code: 'bc', name: 'British Columbia', avgRate: '500-700' },
      { code: 'on', name: 'Ontario', avgRate: '475-650' },
      { code: 'qc', name: 'Quebec', avgRate: '450-625' },
      { code: 'sk', name: 'Saskatchewan', avgRate: '500-700' },
    ],
    loadTypes: [
      { type: 'Wide Load', rate: 'C$550-750/day' },
      { type: 'Oversize', rate: 'C$500-700/day' },
      { type: 'Heavy Haul', rate: 'C$600-850/day' },
    ],
  },
  au: {
    name: 'Australia', flag: '\ud83c\udde6\ud83c\uddfa', currency: 'AUD', symbol: 'A$', avgRate: '600-900',
    regions: [
      { code: 'nsw', name: 'New South Wales', avgRate: '650-950' },
      { code: 'vic', name: 'Victoria', avgRate: '600-850' },
      { code: 'qld', name: 'Queensland', avgRate: '650-900' },
      { code: 'wa', name: 'Western Australia', avgRate: '700-1000' },
      { code: 'sa', name: 'South Australia', avgRate: '600-850' },
    ],
    loadTypes: [
      { type: 'Wide Load', rate: 'A$700-1000/day' },
      { type: 'Oversize', rate: 'A$600-900/day' },
      { type: 'Heavy Transport', rate: 'A$800-1200/day' },
    ],
  },
  gb: {
    name: 'United Kingdom', flag: '\ud83c\uddec\ud83c\udde7', currency: 'GBP', symbol: '\u00a3', avgRate: '350-550',
    regions: [
      { code: 'england', name: 'England', avgRate: '350-550' },
      { code: 'scotland', name: 'Scotland', avgRate: '375-575' },
      { code: 'wales', name: 'Wales', avgRate: '325-500' },
      { code: 'northern-ireland', name: 'Northern Ireland', avgRate: '300-475' },
    ],
    loadTypes: [
      { type: 'Abnormal Load', rate: '\u00a3400-600/day' },
      { type: 'Wide Load', rate: '\u00a3350-550/day' },
      { type: 'Escort Vehicle', rate: '\u00a3300-500/day' },
    ],
  },
};

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const data = COUNTRY_DATA[country];
  if (!data) return { title: 'Rate Guide | Haul Command' };
  return {
    title: `Pilot Car Cost in ${data.name} \u2014 2026 Rates | Haul Command`,
    description: `Current pilot car and escort vehicle rates in ${data.name}. Average day rates, corridor pricing, and live market data from Haul Command.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function CountryRatePage({ params }: Props) {
  const { country } = await params;
  const data = COUNTRY_DATA[country];
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{data.flag}</span>
            <h1 className="text-3xl md:text-4xl font-bold">
              Pilot Car Cost in {data.name} \u2014 2026 Rates
            </h1>
          </div>
          <p className="text-gray-400 mb-8">
            Average day rate: <span className="text-amber-400 font-bold text-xl">{data.symbol}{data.avgRate}</span> ({data.currency})
          </p>

          {/* Rate by Load Type */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Rate by Load Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.loadTypes.map((lt) => (
                <div key={lt.type} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-sm text-gray-400">{lt.type}</p>
                  <p className="text-lg font-bold text-amber-400">{lt.rate}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Rates by Region</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.regions.map((region) => (
                <Link
                  key={region.code}
                  href={`/rates/${country}/${region.code}`}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
                >
                  <p className="font-semibold">{region.name}</p>
                  <p className="text-amber-400 font-bold">{data.symbol}{region.avgRate}/day</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/loads" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors">
              Post a Load in {data.name}
            </Link>
            <Link href={`/directory/${country}`} className="px-6 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors">
              Find Operators in {data.name}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
