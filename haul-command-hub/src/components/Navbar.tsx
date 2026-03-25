import Link from 'next/link';
import { RoleSwitcher } from '@/components/hc/RoleSelector';
import HaulCommandLogo from '@/components/hc/HaulCommandLogo';
import { CabModeToggle } from '@/components/hc/CabModeToggle';

const NAV_LINKS = [
  { href: '/directory', label: 'Directory' },
  { href: '/requirements', label: 'Requirements' },
  { href: '/services', label: 'Services' },
  { href: '/rates', label: 'Rates' },
  { href: '/corridors', label: 'Corridors' },
  { href: '/loads', label: 'Loads' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Intelligence' },
  { href: '/broker', label: 'Brokers' },
];

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 overflow-hidden max-w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center min-w-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <HaulCommandLogo variant="full" size="md" />
            <RoleSwitcher />
          </div>
          <div className="hidden md:ml-6 md:flex md:space-x-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-accent hover:bg-white/[0.03] px-3 py-2 rounded-lg text-sm font-medium transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <CabModeToggle />
            <Link
              href="/claim"
              className="hidden sm:inline-flex bg-accent text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors ag-magnetic"
            >
              Claim Listing
            </Link>
            <Link
              href="/login"
              className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
