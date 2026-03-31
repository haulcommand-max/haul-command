import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const UniversalPermitChecker = dynamic(
  () => import('@/components/tools/UniversalPermitChecker'),
  { ssr: false }
);

type Props = { params: Promise<{ country_code: string; slug: string }> };

async function getTool(countryCode: string, slug: string) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('hc_seo_tools')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .eq('local_seo_slug', slug)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country_code, slug } = await params;
  const tool = await getTool(country_code, slug);
  if (!tool) return { title: 'Tool Not Found | Haul Command' };

  return {
    title: `${tool.h1_title} | Haul Command`,
    description: tool.meta_description || `Free ${tool.h1_title}. Check permit complexity, escort requirements, and regulatory compliance. Powered by ${tool.regulatory_body} data.`,
    openGraph: {
      title: tool.h1_title,
      description: tool.meta_description,
      url: `https://haulcommand.com/tools/${tool.country_code.toLowerCase()}/${tool.local_seo_slug}`,
    },
    alternates: {
      canonical: `https://haulcommand.com/tools/${tool.country_code.toLowerCase()}/${tool.local_seo_slug}`,
    },
  };
}

export const revalidate = 86400;

export default async function LocalizedToolPage({ params }: Props) {
  const { country_code, slug } = await params;
  const tool = await getTool(country_code, slug);
  if (!tool) notFound();

  /* ── JSON-LD: SoftwareApplication + BreadcrumbList ── */
  const toolSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.h1_title,
    description: tool.meta_description || `Free ${tool.tool_type} for ${tool.country_code}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: tool.currency_code },
    author: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://haulcommand.com/tools' },
      { '@type': 'ListItem', position: 3, name: tool.country_code.toUpperCase(), item: `https://haulcommand.com/tools/${tool.country_code.toLowerCase()}` },
      { '@type': 'ListItem', position: 4, name: tool.h1_title, item: `https://haulcommand.com/tools/${tool.country_code.toLowerCase()}/${tool.local_seo_slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <UniversalPermitChecker
        countryCode={tool.country_code}
        toolType={tool.tool_type}
        h1Title={tool.h1_title}
        unitSystem={tool.unit_system}
        currencyCode={tool.currency_code}
        regulatoryBody={tool.regulatory_body}
        regulatoryVariables={tool.regulatory_variables}
        tier={tool.tier}
        metaDescription={tool.meta_description}
      />
    </>
  );
}
