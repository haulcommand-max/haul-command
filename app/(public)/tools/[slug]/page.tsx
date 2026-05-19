import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { ESC_TOOL_PAGES, getEscToolPage } from "@/lib/esc/esc-public-content";
import {
  getPageSeoContract,
  metadataFromDbPageSeoContract,
  normalizeStructuredData,
} from "@/lib/seo/page-seo-contract-db";

export function generateStaticParams() {
  return Object.keys(ESC_TOOL_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getEscToolPage(slug);
  if (!page) return {};
  const path = `/tools/${slug}`;
  const contract = await getPageSeoContract(path);
  if (contract) return metadataFromDbPageSeoContract(contract, path);

  return {
    title: `${page.title} | Haul Command Tools`,
    description: page.description,
    alternates: { canonical: `https://www.haulcommand.com${path}` },
  };
}

export default async function ToolSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getEscToolPage(slug);
  if (!page) notFound();
  const contract = await getPageSeoContract(`/tools/${slug}`);
  const contractJsonLd = normalizeStructuredData(contract?.structured_data_json ?? null);

  return (
    <>
      {contractJsonLd ? <JsonLd data={contractJsonLd} /> : null}
      <EscPublicPage page={page} />
    </>
  );
}
