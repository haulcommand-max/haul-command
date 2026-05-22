import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { CorridorPricingClient } from './CorridorPricingClient';
import type { CorridorPricingRecord } from '@/lib/tools/corridorPricing';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Corridor Pricing Estimator | Haul Command',
  description:
    'Estimate heavy haul and pilot car lane pricing from stored corridor rate signals or manual quote inputs. Confirm live quotes before booking.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/corridor-pricing' },
};

export default async function CorridorPricingHistoryPage() {
  const supabase = createClient();
  const { data: pricing } = await supabase
    .from('hc_corridor_pricing')
    .select('*')
    .order('corridor_slug', { ascending: true })
    .order('month_start', { ascending: false });

  return (
    <>
      <ProofStrip variant="bar" />
      <CorridorPricingClient records={(pricing || []) as CorridorPricingRecord[]} />
    </>
  );
}
