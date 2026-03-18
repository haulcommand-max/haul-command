import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} Corridors — Broker | HAUL COMMAND`, description: `Active corridors for broker ${slug}.` };
}

export default async function BrokerCorridorsPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Brokers' }, { label: slug, href: `/broker/${slug}` }, { label: 'Corridors', isCurrent: true }]} />
      <HCLocalIntroCopy h1={`${slug} — Corridor Activity`} intro="View which corridors this broker is most active on, helping you position escort coverage." />
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center mb-8">
        <p className="text-gray-500 text-sm">Corridor data for this broker is being aggregated.</p>
      </div>
      <HCAlertSignupModule context={`${slug} corridor activity`} />
    </main>
  );
}
