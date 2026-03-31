import Link from 'next/link';
import HaulCommandLogo from '@/components/hc/HaulCommandLogo';
import SocialLinks from '@/components/hc/SocialLinks';

const FOOTER_SECTIONS = [
  {
    title: 'Directory',
    links: [
      { href: '/directory', label: 'Browse Directory' },
      { href: '/escort-requirements', label: 'Requirements' },
      { href: '/corridors', label: 'Corridors' },
      { href: '/services/pilot-car-operator', label: 'Pilot Car Operators' },
      { href: '/countries', label: '120 Countries' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { href: '/dispatch', label: '⚡ Live Dispatch' },
      { href: '/loads', label: 'Load Board' },
      { href: '/glossary/us/pilot-car', label: 'HC Glossary' },
      { href: '/map', label: 'Route Intelligence' },
      { href: '/leaderboards', label: 'Leaderboards' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '/tools/permit-checker/us', label: 'Permit Checker' },
      { href: '/tools/escort-rules/us', label: 'Escort Rule Finder' },
      { href: '/tools/rate-estimator/us', label: 'Rate Estimator' },
      { href: '/tools/broker-verify', label: 'Broker Verify' },
      { href: '/tools/superload-alerts', label: 'Superload Alerts' },
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
      { href: '/directory/ae', label: '🇦🇪 UAE' },
      { href: '/directory/za', label: '🇿🇦 South Africa' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/blog', label: 'Intelligence Blog' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/claim', label: 'Claim Profile' },
      { href: '/contact', label: 'Contact Us' },
      { href: '/advertise/create', label: 'Advertise' },
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
          <div className="flex flex-col items-center sm:items-start gap-2">
            <HaulCommandLogo variant="full" size="sm" />
            <p className="text-sm text-white/40">Built for the corridor. Not the crowd.</p>
            <SocialLinks />
          </div>
          <div className="text-[10px] text-gray-600">
            © {new Date().getFullYear()} Haul Command. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
