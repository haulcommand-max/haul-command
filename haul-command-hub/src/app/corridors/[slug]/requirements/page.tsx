import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCorridorBySlug } from '@/lib/hc-loaders/corridor';

export const revalidate = 86400;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCorridorBySlug(slug);
  return { title: `Requirements on ${c?.name ?? slug} — HAUL COMMAND`, description: `Escort requirements along the ${c?.name ?? slug} corridor.` };
}

export default async function CorridorRequirementsPage({ params }: Props) {
  const { slug } = await params;
  const corridor = await getCorridorBySlug(slug);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Corridors', href: '/corridors' },
        { label: corridor?.name ?? slug, href: `/corridors/${slug}` },
        { label: 'Requirements', isCurrent: true },
      ]} />
      <HCLocalIntroCopy h1={`Requirements on ${corridor?.name ?? slug}`} intro="Escort requirements along jurisdictions crossed by this corridor." />
      <HCAlertSignupModule context={`requirements on ${corridor?.name ?? slug}`} />
    </main>
  );
}
