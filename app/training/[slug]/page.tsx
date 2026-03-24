import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${title} — HC Certified Training`,
    description: `Complete the ${title} module to earn your HC certification. Built on FMCSA and SC&RA Best Practices.`,
  };
}

export { default } from './_ModuleDetail';
