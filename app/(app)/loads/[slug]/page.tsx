import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { LOAD_TYPE_REGISTRY } from './TypePage';
import TypePage from './TypePage';
import SlugPage, { generateMetadata as slugGenerateMetadata } from './SlugPage';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await props.params;

  if (LOAD_TYPE_REGISTRY[slug]) {
    const entry = LOAD_TYPE_REGISTRY[slug];
    const typeLabel = entry?.title ?? slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const title = entry
      ? `${entry.title} Escort & Pilot Car Requirements | Haul Command`
      : `Heavy Haul Transport Intel — ${typeLabel} | Haul Command`;
    const description = entry?.description ?? 'Find qualified certified escort operators for specialized heavy haul transport on Haul Command.';
    
    return {
      title,
      description,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  // Fallback to load details metadata
  return slugGenerateMetadata(props, parent);
}

export default async function CombinedLoadPage(props: Props) {
  const { slug } = await props.params;

  if (LOAD_TYPE_REGISTRY[slug]) {
    // Pass as a simple object to match TypePage's expected props
    return <TypePage params={{ type: slug }} />;
  }

  return <SlugPage params={props.params} />;
}
