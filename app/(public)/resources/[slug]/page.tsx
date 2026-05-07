import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import { ESC_RESOURCE_PAGES, getEscResourcePage } from "@/lib/esc/esc-public-content";

export function generateStaticParams() {
  return Object.keys(ESC_RESOURCE_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getEscResourcePage(slug);
  if (!page) return {};

  return {
    title: `${page.title} | Haul Command`,
    description: page.description,
    alternates: { canonical: `https://www.haulcommand.com/resources/${slug}` },
  };
}

export default async function ResourceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getEscResourcePage(slug);
  if (!page) notFound();

  return <EscPublicPage page={page} />;
}
