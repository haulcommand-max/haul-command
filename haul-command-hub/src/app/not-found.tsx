import Link from 'next/link';
import HCClaimCorrectVerifyPanel from '@/components/hc/ClaimCorrectVerifyPanel';

export default function NotFound() {
  const quickMarkets = [
    { label: '🇺🇸 United States', href: '/directory/us' },
    { label: '🇨🇦 Canada', href: '/directory/ca' },
    { label: '🇦🇺 Australia', href: '/directory/au' },
    { label: '🇬🇧 United Kingdom', href: '/directory/gb' },
    { label: '🇩🇪 Germany', href: '/directory/de' },
    { label: '🇧🇷 Brazil', href: '/directory/br' },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-16 min-h-screen text-center">
      <h1 className="text-5xl font-black text-white mb-4">Page Not Found</h1>
      <p className="text-gray-400 text-lg mb-8">
        The page you're looking for doesn't exist or has moved. Here's where you might find what you need:
      </p>

      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Explore Live Markets</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {quickMarkets.map((m, i) => (
            <Link key={i} href={m.href} className="inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-accent/10 border border-white/[0.08] hover:border-accent/30 text-gray-300 hover:text-accent rounded-full px-4 py-1.5 text-xs font-medium transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Link href="/directory" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
          <span className="text-lg">📂</span>
          <p className="text-xs text-gray-300 mt-1">Directory</p>
        </Link>
        <Link href="/corridors" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
          <span className="text-lg">🛤️</span>
          <p className="text-xs text-gray-300 mt-1">Corridors</p>
        </Link>
        <Link href="/requirements" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
          <span className="text-lg">📋</span>
          <p className="text-xs text-gray-300 mt-1">Requirements</p>
        </Link>
        <Link href="/services" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
          <span className="text-lg">🚛</span>
          <p className="text-xs text-gray-300 mt-1">Services</p>
        </Link>
        <Link href="/rates" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
          <span className="text-lg">💰</span>
          <p className="text-xs text-gray-300 mt-1">Rates</p>
        </Link>
        <Link href="/claim" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
          <span className="text-lg">🏷️</span>
          <p className="text-xs text-gray-300 mt-1">Claim Listing</p>
        </Link>
      </div>

      <div className="text-left">
        <HCClaimCorrectVerifyPanel />
      </div>
    </main>
  );
}
