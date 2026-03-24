import Link from 'next/link';

export interface ToolCTAProps {
  /** Primary CTA — highest-impact action */
  primary: {
    label: string;
    href: string;
    icon?: string;
  };
  /** Secondary CTA — alternative action */
  secondary?: {
    label: string;
    href: string;
    icon?: string;
  };
  /** Context line shown above CTAs */
  context?: string;
}

/**
 * ToolResultCTA — Conversion enforcement for every tool output.
 * 
 * The "No Dead End" rule: every tool result MUST show at least
 * one high-value CTA that routes users toward a transaction,
 * directory search, or profile claim.
 * 
 * Usage: Place after every tool result panel.
 */
export default function ToolResultCTA({ primary, secondary, context }: ToolCTAProps) {
  return (
    <div className="mt-6 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-5 sm:p-6">
      {context && (
        <p className="text-gray-400 text-xs mb-3">{context}</p>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Link
          href={primary.href}
          className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors text-center flex items-center justify-center gap-2"
        >
          {primary.icon && <span>{primary.icon}</span>}
          {primary.label}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="bg-white/[0.05] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/[0.1] transition-colors text-center border border-white/[0.08] flex items-center justify-center gap-2"
          >
            {secondary.icon && <span>{secondary.icon}</span>}
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Pre-configured CTA configs for common tool outcomes.
 * Import these in tool pages to enforce conversion.
 */
export const TOOL_CTAS = {
  escortResult: (state?: string): ToolCTAProps => ({
    context: 'Based on your load dimensions, you need escort vehicles for this route.',
    primary: {
      label: 'Find Escorts Now',
      href: state ? `/directory/us/${state}` : '/directory',
      icon: '🔍',
    },
    secondary: {
      label: 'Post This Load',
      href: '/loads',
      icon: '📦',
    },
  }),

  rateResult: (): ToolCTAProps => ({
    context: 'Know what to charge. Now find operators at this rate.',
    primary: {
      label: 'Find Operators',
      href: '/directory',
      icon: '🔍',
    },
    secondary: {
      label: 'Post a Load',
      href: '/loads',
      icon: '📦',
    },
  }),

  complianceResult: (): ToolCTAProps => ({
    context: 'You now know the requirements. Find compliant operators instantly.',
    primary: {
      label: 'Find Compliant Escorts',
      href: '/directory',
      icon: '✅',
    },
    secondary: {
      label: 'View Requirements',
      href: '/requirements',
      icon: '📋',
    },
  }),

  superloadResult: (): ToolCTAProps => ({
    context: 'This load requires specialized planning. Connect with experienced operators.',
    primary: {
      label: 'Find Superload Escorts',
      href: '/directory',
      icon: '🚛',
    },
    secondary: {
      label: 'Claim Your Listing',
      href: '/claim',
      icon: '🏷️',
    },
  }),

  costResult: (): ToolCTAProps => ({
    context: 'Cost estimate ready. Turn it into a real booking.',
    primary: {
      label: 'Post This Load',
      href: '/loads',
      icon: '📦',
    },
    secondary: {
      label: 'Find Escorts in Area',
      href: '/directory',
      icon: '🔍',
    },
  }),

  fridayResult: (): ToolCTAProps => ({
    context: 'Movement window confirmed. Secure your escorts before the weekend.',
    primary: {
      label: 'Book Escorts Now',
      href: '/directory',
      icon: '🔍',
    },
    secondary: {
      label: 'Check Another Date',
      href: '/tools/friday-checker',
      icon: '📅',
    },
  }),
};
