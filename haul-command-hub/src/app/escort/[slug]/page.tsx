import { notFound } from 'next/navigation';
import { getProviderProfile } from '@/lib/hc-loaders/provider-profile';

export const revalidate = 3600;

export default async function EscortAliasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getProviderProfile(slug);
  if (!profile) return notFound();
  // Redirect to canonical place page
  const { redirect } = await import('next/navigation');
  redirect(`/place/${slug}`);
}
