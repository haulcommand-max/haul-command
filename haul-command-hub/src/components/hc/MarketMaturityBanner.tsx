import type { MarketMaturityState } from '@/lib/hc-types';
import type { HCLink } from '@/lib/hc-types';

interface MarketMaturityBannerProps {
  state: MarketMaturityState;
  countryName: string;
  message?: string;
  links?: HCLink[];
}

const STATE_CONFIG: Record<MarketMaturityState, { bg: string; text: string; label: string; dot: string }> = {
  live: {
    bg: 'bg-green-500/10 border-green-500/20',
    text: 'text-green-400',
    label: 'LIVE',
    dot: 'bg-green-500',
  },
  data_only: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-400',
    label: 'DATA AVAILABLE',
    dot: 'bg-blue-500',
  },
  planned: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
    label: 'PLANNED',
    dot: 'bg-amber-500',
  },
  future: {
    bg: 'bg-gray-500/10 border-gray-500/20',
    text: 'text-gray-400',
    label: 'COMING SOON',
    dot: 'bg-gray-500',
  },
};

export function HCMarketMaturityBanner({
  state: maturityState,
  countryName,
  message,
  links,
}: MarketMaturityBannerProps) {
  const config = STATE_CONFIG[maturityState];

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3 mb-6 ${config.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot} ${maturityState === 'live' ? 'animate-pulse' : ''}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>
          {config.label}
        </span>
      </div>
      {countryName && <span className="text-white text-sm font-medium">{countryName}</span>}
      {message && (
        <span className="text-gray-400 text-xs">{message}</span>
      )}
      {links && links.length > 0 && (
        <div className="flex gap-3 ml-auto">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className={`text-xs font-medium ${config.text} hover:underline`}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Backward compatibility
export default HCMarketMaturityBanner;
