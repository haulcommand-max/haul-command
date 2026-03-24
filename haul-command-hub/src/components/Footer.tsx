import Link from 'next/link';

const FOOTER_SECTIONS = [
  {
    title: 'Directory',
    links: [
      { href: '/directory', label: 'Browse Directory' },
      { href: '/requirements', label: 'Requirements' },
      { href: '/corridors', label: 'Corridors' },
      { href: '/services', label: 'Services' },
      { href: '/rates', label: 'Rate Intelligence' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '/tools/escort-calculator', label: 'Route Calculator' },
      { href: '/tools/friday-checker', label: 'Friday Checker' },
      { href: '/tools/superload-meter', label: 'Superload Meter' },
      { href: '/tools/cost-estimator', label: 'Cost Estimator' },
    ],
  },
  {
    title: 'Top Markets',
    links: [
      { href: '/directory/us', label: '🇺🇸 United States' },
      { href: '/directory/ca', label: '🇨🇦 Canada' },
      { href: '/directory/au', label: '🇦🇺 Australia' },
      { href: '/directory/gb', label: '🇬🇧 United Kingdom' },
      { href: '/directory/de', label: '🇩🇪 Germany' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/blog', label: 'Intelligence Blog' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/claim', label: 'Claim Listing' },
      { href: '/contact', label: 'Contact Us' },
      { href: '/advertise/create', label: 'Advertise' },
      { href: '/developers', label: 'API & Developers' },
      { href: '/report-data-issue', label: 'Report Issue' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/legal/dpa', label: 'Data Processing Agreement' },
      { href: '/glossary', label: 'Glossary' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#060a14] overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-bold text-sm mb-3">{section.title}</h4>
              <div className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-gray-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/5">
          <div className="text-accent font-black tracking-tighter text-xl">
            HAUL COMMAND
          </div>
          <div className="text-[10px] text-gray-600">
            Built for the corridor. Not the crowd.
          </div>
        </div>
      </div>
    </footer>
  );
}
