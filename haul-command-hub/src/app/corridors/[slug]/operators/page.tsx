import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCorridorBySlug, getCorridorOperators } from '@/lib/hc-loaders/corridor';
import Link from 'next/link';

export const revalidate = 86400;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCorridorBySlug(slug);
  return { title: `Operators on ${c?.name ?? slug} — HAUL COMMAND`, description: `Escort operators serving the ${c?.name ?? slug} corridor.` };
}

export default async function CorridorOperatorsPage({ params }: Props) {
  const { slug } = await params;
  const corridor = await getCorridorBySlug(slug);
  const operators = await getCorridorOperators(slug);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Corridors', href: '/corridors' },
        { label: corridor?.name ?? slug, href: `/corridors/${slug}` },
        { label: 'Operators', isCurrent: true },
      ]} />
      <HCLocalIntroCopy h1={`Operators on ${corridor?.name ?? slug}`} intro={operators.length > 0 ? `${operators.length} operators serve this corridor.` : 'Operator data is being collected for this corridor.'} />
      {operators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {operators.map((op: any) => (
            <Link key={op.id} href={`/place/${op.slug}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
              <h3 className="text-sm font-bold text-white">{op.name}</h3>
              <p className="text-[10px] text-gray-500">{[op.locality, op.admin1_code].filter(Boolean).join(', ')}</p>
            </Link>
          ))}
        </div>
      ) : <HCAlertSignupModule context={`operators on ${corridor?.name ?? slug}`} />}
    </main>
  );
}
