'use client';
import { motion } from 'framer-motion';

const TIERS = [
  {
    name: 'Tier A — Gold',
    badge: 'Primary Markets',
    gradient: 'from-amber-400 to-amber-600',
    border: 'border-amber-500/30',
    bgImage: 'url("/images/tiers/tier_a.png")',
    glow: 'bg-amber-500/5',
    text: 'text-amber-400',
    countries: [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'AU', name: 'Australia' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'ZA', name: 'South Africa' },
      { code: 'DE', name: 'Germany' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'AE', name: 'UAE' },
      { code: 'BR', name: 'Brazil' },
    ]
  },
  {
    name: 'Tier B — Blue',
    badge: 'Core Logistics Hubs',
    gradient: 'from-blue-400 to-blue-600',
    border: 'border-blue-500/30',
    bgImage: 'url("/images/tiers/tier_b.png")',
    glow: 'bg-blue-500/5',
    text: 'text-blue-400',
    countries: [
      { code: 'IE', name: 'Ireland' }, { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
      { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' }, { code: 'BE', name: 'Belgium' },
      { code: 'AT', name: 'Austria' }, { code: 'CH', name: 'Switzerland' }, { code: 'ES', name: 'Spain' },
      { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' }, { code: 'PT', name: 'Portugal' },
      { code: 'SA', name: 'Saudi Arabia' }, { code: 'QA', name: 'Qatar' }, { code: 'MX', name: 'Mexico' },
      { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'TH', name: 'Thailand' },
    ]
  },
  {
    name: 'Tier C — Silver',
    badge: 'Emerging Trade Routes',
    gradient: 'from-gray-300 to-gray-500',
    border: 'border-gray-400/30',
    bgImage: 'url("/images/tiers/tier_c.png")',
    glow: 'bg-gray-400/5',
    text: 'text-gray-300',
    countries: [
      { code: 'PL', name: 'Poland' }, { code: 'CZ', name: 'Czechia' }, { code: 'SK', name: 'Slovakia' },
      { code: 'HU', name: 'Hungary' }, { code: 'SI', name: 'Slovenia' }, { code: 'EE', name: 'Estonia' },
      { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' }, { code: 'HR', name: 'Croatia' },
      { code: 'RO', name: 'Romania' }, { code: 'BG', name: 'Bulgaria' }, { code: 'GR', name: 'Greece' },
      { code: 'TR', name: 'Turkey' }, { code: 'KW', name: 'Kuwait' }, { code: 'OM', name: 'Oman' },
      { code: 'BH', name: 'Bahrain' }, { code: 'SG', name: 'Singapore' }, { code: 'MY', name: 'Malaysia' },
      { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' }, { code: 'CL', name: 'Chile' },
      { code: 'AR', name: 'Argentina' }, { code: 'CO', name: 'Colombia' }, { code: 'PE', name: 'Peru' },
      { code: 'VN', name: 'Vietnam' }, { code: 'PH', name: 'Philippines' },
    ]
  },
  {
    name: 'Tier D — Slate',
    badge: 'New Frontiers',
    gradient: 'from-slate-500 to-slate-700',
    border: 'border-slate-500/30',
    bgImage: 'url("/images/tiers/tier_d.png")',
    glow: 'bg-slate-500/5',
    text: 'text-slate-400',
    countries: [
      { code: 'UY', name: 'Uruguay' },
      { code: 'PA', name: 'Panama' },
      { code: 'CR', name: 'Costa Rica' },
    ]
  }
];

export function GlobalTiersSection() {
  return (
    <section className="py-24 px-4 relative z-10 w-full">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">57 Countries Supported</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our route intelligence engine processes complex compliance logic across our tiered global network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
              className={`relative overflow-hidden p-6 rounded-3xl border ${tier.border} ${tier.glow} backdrop-blur-sm group transition-all`}
            >
              {/* Background Plate Layer */}
              <div 
                className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none mix-blend-screen"
                style={{
                  backgroundImage: tier.bgImage,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              {/* Added solid dark scrim so text stays readable over AI backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0 pointer-events-none" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className={`text-2xl font-bold ${tier.text} mb-2`}>{tier.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-white tracking-wide">
                    {tier.badge}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center font-bold text-lg">
                  {tier.countries.length}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 relative z-10">
                {tier.countries.map(country => (
                  <div key={country.code} className="group/item flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg text-sm text-gray-300 hover:border-white/20 transition-colors cursor-default">
                    <span className="opacity-60 group-hover/item:opacity-100 font-mono text-xs shadow-black">{country.code}</span>
                    <span className="font-medium drop-shadow-md">{country.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Decorative gradient flare on hover */}
              <div className={`absolute -inset-2 bg-gradient-to-r ${tier.gradient} opacity-0 blur-2xl group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none z-0`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

