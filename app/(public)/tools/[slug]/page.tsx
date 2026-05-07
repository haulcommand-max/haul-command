import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import { ESC_TOOL_PAGES, getEscToolPage } from "@/lib/esc/esc-public-content";

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

  return {
    title: `${page.title} | Haul Command Tools`,
    description: page.description,
    alternates: { canonical: `https://www.haulcommand.com/tools/${slug}` },
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

  return <EscPublicPage page={page} />;
}
