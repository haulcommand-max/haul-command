import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import { ESC_GLOSSARY_PAGES, getEscGlossaryPage } from "@/lib/esc/esc-public-content";

export function generateStaticParams() {
  return Object.keys(ESC_GLOSSARY_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getEscGlossaryPage(slug);
  if (!page) return {};

  return {
    title: `${page.title} | Heavy Haul Glossary | Haul Command`,
    description: page.description,
    alternates: { canonical: `https://www.haulcommand.com/glossary/${slug}` },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getEscGlossaryPage(slug);
  if (!page) notFound();

  return <EscPublicPage page={page} />;
}
