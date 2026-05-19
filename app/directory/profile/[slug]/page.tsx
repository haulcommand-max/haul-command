import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { buildDirectoryDossierHref } from '@/lib/directory/routes';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalPath = buildDirectoryDossierHref(slug);

  return {
    title: 'Directory profile moved | Haul Command',
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://www.haulcommand.com${canonicalPath}`,
    },
  };
}

export default async function LegacyDirectoryProfilePage({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(buildDirectoryDossierHref(slug));
}
