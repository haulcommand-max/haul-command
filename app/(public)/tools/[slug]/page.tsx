import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import { ESC_TOOL_PAGES, getEscToolPage } from "@/lib/esc/esc-public-content";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RegistryRow = {
  slug: string;
  status: string | null;
  audit_redirect_to: string | null;
};

// Returns the path to 301 to when this slug is hidden in the registry.
// Returns null when the slug is not in the registry or has no redirect.
async function getRedirectTargetForHiddenSlug(slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("hc_tool_registry")
    .select("slug, status, audit_redirect_to")
    .eq("slug", slug)
    .maybeSingle<RegistryRow>();

  if (!data) return null;
  if (data.status !== "internal_only") return null;
  if (!data.audit_redirect_to) return null;
  return data.audit_redirect_to;
}

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

  // 1) 301 hidden tools to their audit-assigned target.
  const redirectTarget = await getRedirectTargetForHiddenSlug(slug);
  if (redirectTarget) {
    permanentRedirect(redirectTarget);
  }

  // 2) Render the ESC tool page if this slug is one of the known ESC tools.
  const page = getEscToolPage(slug);
  if (!page) notFound();

  return <EscPublicPage page={page} />;
}
