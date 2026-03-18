import type { HCLink } from '@/lib/hc-types';

interface TrustGuardrailsProps {
  sponsoredDisclosureUrl?: string;
  methodologyUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
  removeListingUrl?: string;
  reportIssueUrl?: string;
}

export default function HCTrustGuardrailsModule({
  sponsoredDisclosureUrl,
  methodologyUrl,
  privacyUrl = '/privacy',
  termsUrl = '/terms',
  removeListingUrl = '/remove-listing',
  reportIssueUrl = '/report-data-issue',
}: TrustGuardrailsProps) {
  const links: HCLink[] = [
    { label: 'Privacy Policy', href: privacyUrl },
    { label: 'Terms of Service', href: termsUrl },
    { label: 'Remove Listing', href: removeListingUrl },
    { label: 'Report Data Issue', href: reportIssueUrl },
  ];

  if (methodologyUrl) {
    links.push({ label: 'Methodology', href: methodologyUrl });
  }
  if (sponsoredDisclosureUrl) {
    links.push({ label: 'Sponsored Content Policy', href: sponsoredDisclosureUrl });
  }

  return (
    <div className="border-t border-white/5 pt-6 mt-6">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="text-center text-[10px] text-gray-600 mt-3">
        © {new Date().getFullYear()} Haul Command. Data is provided for informational purposes only. 
        Listings may include paid placements, which are always labeled.
      </p>
    </div>
  );
}
