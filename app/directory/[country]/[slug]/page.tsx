import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OperatorProfilePage, generateOperatorMetadata } from './OperatorProfile';
import { StateDirectoryPage, generateStateMetadata } from './StateDirectory';

interface Props {
  params: Promise<{ country: string; slug: string }>;
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, country } = await params;
  
  if (slug.length === 2 && slug.match(/^[a-zA-Z]{2}$/)) {
    return generateStateMetadata({ params: Promise.resolve({ country, state: slug }), searchParams: Promise.resolve({}) });
  }
  
  return generateOperatorMetadata({ params: { country, slug } });
}

export default async function DirectoryDynamicRouter({ params, searchParams }: Props) {
  const { slug, country } = await params;
  
  // If slug is exactly 2 letters, treat it as a state code (e.g., 'tx', 'ca')
  if (slug.length === 2 && slug.match(/^[a-zA-Z]{2}$/)) {
    return <StateDirectoryPage params={Promise.resolve({ country, state: slug })} searchParams={searchParams} />;
  }
  
  // Otherwise, treat as an operator profile slug
  return <OperatorProfilePage params={{ country, slug }} />;
}
