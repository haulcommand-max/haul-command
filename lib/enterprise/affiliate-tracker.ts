export interface AffiliateClick {
  partner: string;
  userId?: string;
  source: string;
  timestamp: string;
  url: string;
}

export const AFFILIATE_PARTNERS = {
  clcLodging: {
    name: 'CLC Lodging',
    category: 'lodging',
    baseUrl: 'https://www.clclodging.com',
    commission: '8%',
  },
  wexFleet: {
    name: 'WEX Fleet Card',
    category: 'fuel',
    baseUrl: 'https://www.wexinc.com',
    commission: '$5/signup',
  },
  checkr: {
    name: 'Checkr',
    category: 'background_check',
    baseUrl: 'https://checkr.com',
    commission: '15%',
  },
  permitWorks: {
    name: 'Permit Works',
    category: 'permits',
    baseUrl: 'https://permitworks.com',
    commission: '10%',
  },
} as const;

export function generateAffiliateUrl(partner: keyof typeof AFFILIATE_PARTNERS, userId?: string): string {
  const config = AFFILIATE_PARTNERS[partner];
  const params = new URLSearchParams({ ref: 'haulcommand' });
  if (userId) params.set('uid', userId);
  return `${config.baseUrl}?${params.toString()}`;
}

export function trackAffiliateClick(click: AffiliateClick): void {
  // Fire-and-forget tracking — will be persisted to Supabase in middleware
  if (typeof window !== 'undefined') {
    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(click),
    }).catch(() => {});
  }
}
