import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title:`${slug}Loads — Broker`, description: `Recent load patterns for broker ${slug}.` };
}

export default async function BrokerLoadsPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Brokers' }, { label: slug, href: `/broker/${slug}` }, { label: 'Loads', isCurrent: true }]} />
      <HCLocalIntroCopy h1={`${slug} — Load Patterns`} intro="Historical and recent load activity from this broker. Use this data to plan your escort coverage." />
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center mb-8">
        <p className="text-gray-500 text-sm">Load data for this broker is being aggregated.</p>
      </div>
      <HCAlertSignupModule context={`${slug} load activity`} />
    </main>
  );
}
