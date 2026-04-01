'use client';

import dynamic from 'next/dynamic';

const ComplianceCalculator = dynamic(
  () => import('@/components/hc/ComplianceCalculator'),
  { ssr: false }
);

export default function ComplianceCalculatorWrapper({
  stateCode,
  stateName,
  countryCode,
}: {
  stateCode: string;
  stateName: string;
  countryCode?: string;
}) {
  return (
    <ComplianceCalculator
      stateCode={stateCode}
      stateName={stateName}
      countryCode={countryCode}
    />
  );
}
