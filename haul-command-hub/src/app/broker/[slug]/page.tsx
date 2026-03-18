import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCMarketMaturityBanner } from '@/components/hc/MarketMaturityBanner';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getBrokerProfile } from '@/lib/hc-loaders/broker-profile';

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const broker = await getBrokerProfile(slug);
  const name = broker?.name ?? slug;
  return {
    title: `${name} — Broker Profile | HAUL COMMAND`,
    description: `View ${name}'s broker profile, load patterns, and corridor activity on Haul Command.`,
  };
}

export default async function BrokerProfilePage({ params }: Props) {
  const { slug } = await params;
  const broker = await getBrokerProfile(slug);

  if (!broker) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
        <HCBreadcrumbs crumbs={[{ label: 'Brokers' }, { label: slug, isCurrent: true }]} />
        <HCMarketMaturityBanner state="planned" countryName="" message="This broker profile is being built. Claim it to manage your public presence." />
        <HCLocalIntroCopy h1={`Broker: ${slug}`} intro="This broker profile has not been populated yet. If you represent this company, claim your profile to unlock load posting, corridor analytics, and more." />
        <HCAlertSignupModule context={`${slug} broker profile`} title="Get Notified When This Profile Launches" />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Brokers' }, { label: broker.name, isCurrent: true }]} />
      <HCLocalIntroCopy h1={broker.name} intro={broker.description ?? `${broker.name} broker profile on Haul Command.`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href={`/broker/${slug}/loads`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all">
          <h3 className="text-sm font-bold text-white">📦 Load Patterns</h3>
          <p className="text-xs text-gray-500 mt-1">View recent and historical load activity</p>
        </Link>
        <Link href={`/broker/${slug}/corridors`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all">
          <h3 className="text-sm font-bold text-white">🛤️ Corridor Activity</h3>
          <p className="text-xs text-gray-500 mt-1">View active corridors and routes</p>
        </Link>
      </div>
    </main>
  );
}
