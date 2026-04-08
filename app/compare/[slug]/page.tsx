import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COMPARE_REGISTRY } from './SlugPage';
import { TOPICS } from './TopicPage';
import ComparePage from './SlugPage';
import ComparisonPage from './TopicPage';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  
  if (COMPARE_REGISTRY[slug]) {
    const entry = COMPARE_REGISTRY[slug];
    const title = entry?.metaTitle ?? `Compare vs Haul Command | Haul Command`;
    const description = entry?.metaDescription ?? 'See how Haul Command compares to other platforms for heavy haul operators and brokers.';
    return { title, description, openGraph: { title, description }, twitter: { card: 'summary_large_image', title, description } };
  } else if (TOPICS[slug]) {
    const topic = TOPICS[slug];
    return {
      title: `${topic?.title ?? 'Comparison'} | Haul Command`,
      description: topic?.meta ?? 'Compare pilot car and escort vehicle services.',
    };
  }
  
  return { title: 'Compare | Haul Command' };
}

export default async function CombinedComparePage({ params }: Props) {
  const { slug } = await params;

  if (COMPARE_REGISTRY[slug]) {
    return <ComparePage params={{ slug }} />;
  } else if (TOPICS[slug]) {
    return <ComparisonPage params={{ topic: slug }} />;
  }

  notFound();
}
