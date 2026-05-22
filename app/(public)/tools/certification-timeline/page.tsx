import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { CertificationTimelineClient } from './CertificationTimelineClient';
import type { CertificationPath } from '@/lib/tools/certificationTimeline';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State Certification Timeline Estimator | Haul Command',
  description:
    'Estimate pilot car certification readiness dates using stored jurisdiction requirements, training hours, fees, renewal cycles, and reciprocity indicators.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/certification-timeline' },
};

export default async function CertificationTimelinePage() {
  const supabase = createClient();
  const { data: certs } = await supabase
    .from('hc_certification_paths')
    .select('*')
    .order('jurisdiction_name', { ascending: true });

  const activeRecords = (certs || []) as CertificationPath[];

  return (
    <>
      <ProofStrip variant="bar" />
      <CertificationTimelineClient paths={activeRecords} />
    </>
  );
}
