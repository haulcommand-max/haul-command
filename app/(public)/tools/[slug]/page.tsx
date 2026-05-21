import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  getApprovedToolTrustClaims,
  getToolRenderPacket,
  parseJsonArray,
  renderBlockedToolLabel,
  siteUrl,
  type ToolRenderPacket,
} from "@/lib/tools/tool-substrate";

export const dynamic = "force-dynamic";

type JsonObject = Record<string, unknown>;

export function generateStaticParams() {
  return [];
}

function absoluteUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return siteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function titleFor(packet: ToolRenderPacket) {
  return packet.name || packet.h1_expected || "Haul Command Tool";
}

function descriptionFor(packet: ToolRenderPacket) {
  return packet.short_desc || packet.aeo_answer_block || "Haul Command heavy-haul planning tool.";
}

function hreflangMap(packet: ToolRenderPacket) {
  const pairs = parseJsonArray<{ hreflang?: string; href?: string }>(packet.hreflang_alts);
  return Object.fromEntries(
    pairs
      .filter((pair) => pair.hreflang && pair.href)
      .map((pair) => [pair.hreflang as string, absoluteUrl(pair.href)])
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const packet = await getToolRenderPacket(slug);
  if (!packet) return {};

  const imageAssets = objectValue(packet.image_seo_assets);
  const imageUrl = typeof imageAssets.og_image === "string" ? absoluteUrl(imageAssets.og_image) : undefined;
  const canonical = packet.canonical_url || absoluteUrl(packet.page_url || `/tools/${slug}`);
  const closed = packet.open_tool_render_allowed !== true;

  return {
    title: `${titleFor(packet)} | Haul Command Tools`,
    description: descriptionFor(packet),
    alternates: {
      canonical,
      languages: {
        "x-default": canonical,
        ...hreflangMap(packet),
      } as Record<string, string>,
    },
    robots: closed
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true },
    openGraph: {
      title: titleFor(packet),
      description: descriptionFor(packet),
      url: canonical,
      siteName: "Haul Command",
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: titleFor(packet),
      description: descriptionFor(packet),
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Haul Command",
    url: siteUrl(),
  };
}

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Haul Command",
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function breadcrumbSchema(packet: ToolRenderPacket) {
  const canonical = packet.canonical_url || absoluteUrl(packet.page_url || `/tools/${packet.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tools", item: `${siteUrl()}/tools` },
      { "@type": "ListItem", position: 2, name: titleFor(packet), item: canonical },
    ],
  };
}

function toolSchema(packet: ToolRenderPacket) {
  const canonical = packet.canonical_url || absoluteUrl(packet.page_url || `/tools/${packet.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": packet.schema_org_type || "WebApplication",
    "@id": `${canonical}#tool`,
    name: titleFor(packet),
    url: canonical,
    description: descriptionFor(packet),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: packet.is_free !== false,
    publisher: { "@type": "Organization", name: "Haul Command", url: siteUrl() },
    offers: packet.is_free === false ? undefined : { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

function faqSchema(packet: ToolRenderPacket) {
  const questions = parseJsonArray<{ question?: string; answer?: string; q?: string; a?: string }>(packet.paa_questions);
  if (!questions.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question || item.q || "",
      acceptedAnswer: { "@type": "Answer", text: item.answer || item.a || "" },
    })).filter((item) => item.name && item.acceptedAnswer.text),
  };
}

function speakableSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SpeakableSpecification",
    cssSelector: [".aeo-answer", ".voice-answer"],
  };
}

function datasetSchema(packet: ToolRenderPacket) {
  if (!packet.dataset_eligible) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${titleFor(packet)} data`,
    description: descriptionFor(packet),
    url: packet.canonical_url || absoluteUrl(packet.page_url || `/tools/${packet.slug}`),
  };
}

function ToolUnavailable({ packet }: { packet: ToolRenderPacket }) {
  const reason = renderBlockedToolLabel(packet.open_tool_block_reason);
  return (
    <main className="min-h-screen bg-[#080b10] px-4 py-16 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-950/70 p-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">{reason}</p>
        <h1 className="mb-4 text-3xl font-black">{packet.h1_expected || titleFor(packet)}</h1>
        <div className="aeo-answer mb-6 text-sm leading-7 text-slate-300">
          {packet.aeo_answer_block || "This Haul Command tool is registered, but it is not available until route, content, and QA checks pass."}
        </div>
        <p className="mb-6 text-sm text-slate-400">
          Block reason: {packet.open_tool_block_reason || "qa_pending"}. We do not render the functional tool or tool schema until the crawler validates the destination.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/directory" className="rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-black text-slate-950">Find Support</Link>
          <Link href="/escort-requirements" className="rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-bold text-slate-200">Check Rules</Link>
          <Link href="/claim" className="rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-bold text-slate-200">Claim Profile</Link>
        </div>
      </section>
    </main>
  );
}

export default async function ToolSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [packet, trustClaims] = await Promise.all([
    getToolRenderPacket(slug),
    getApprovedToolTrustClaims(),
  ]);
  if (!packet) notFound();

  const closed = packet.open_tool_render_allowed !== true;
  const questions = parseJsonArray<{ question?: string; answer?: string; q?: string; a?: string }>(packet.paa_questions);
  const comparisons = parseJsonArray<{ label?: string; option_a?: string; option_b?: string; a?: string; b?: string }>(packet.comparison_pairs);
  const glossaryLinks = parseJsonArray<{ term?: string; label?: string; href?: string; url?: string }>(packet.glossary_interlinks);
  const ctas = parseJsonArray<{ label?: string; href?: string; country?: string; service?: string }>(packet.commercial_intent_ctas).slice(0, 60);
  const schemas = closed
    ? [organizationSchema(), websiteSchema(), breadcrumbSchema(packet)]
    : [organizationSchema(), websiteSchema(), breadcrumbSchema(packet), toolSchema(packet), faqSchema(packet), speakableSchema(), datasetSchema(packet)].filter(Boolean);

  if (closed) {
    return (
      <>
        <JsonLd data={schemas as JsonObject[]} />
        <ToolUnavailable packet={packet} />
      </>
    );
  }

  return (
    <>
      <JsonLd data={schemas as JsonObject[]} />
      <main className="min-h-screen bg-[#07090d] px-4 py-12 text-slate-100">
        <article className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
            {packet.freshness_label || "Verified tool"} {packet.last_freshness_at ? `- Last verified ${new Date(packet.last_freshness_at).toLocaleDateString()}` : ""}
          </p>
          <h1 className="mb-5 text-3xl font-black tracking-tight sm:text-5xl">{packet.h1_expected || titleFor(packet)}</h1>
          <div className="aeo-answer mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-base leading-8 text-amber-50">
            {packet.aeo_answer_block || descriptionFor(packet)}
          </div>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            {trustClaims.map((claim) => (
              <div key={`${claim.claim_text}-${claim.source_url}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-2xl font-black text-amber-400">{claim.source_count ?? "Source"}</div>
                <p className="mt-1 text-sm text-slate-300">{claim.claim_text}</p>
                {claim.last_verified_at ? <p className="mt-2 text-[11px] text-slate-500">Verified {new Date(claim.last_verified_at).toLocaleDateString()}</p> : null}
              </div>
            ))}
          </section>

          <section className="voice-answer mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="mb-3 text-xl font-black">Voice Answer</h2>
            <p className="text-sm leading-7 text-slate-300">{packet.voice_answer || packet.aeo_answer_block || descriptionFor(packet)}</p>
          </section>

          {questions.length ? (
            <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="mb-4 text-xl font-black">Common Questions</h2>
              <div className="grid gap-3">
                {questions.map((item, index) => (
                  <details key={index} className="rounded-xl border border-slate-800 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-100">{item.question || item.q}</summary>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.answer || item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {comparisons.length ? (
            <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <h2 className="p-5 text-xl font-black">Compare Options</h2>
              <table className="w-full text-left text-sm">
                <tbody>
                  {comparisons.map((item, index) => (
                    <tr key={index} className="border-t border-slate-800">
                      <th className="p-4 text-slate-200">{item.label || `Comparison ${index + 1}`}</th>
                      <td className="p-4 text-slate-400">{item.option_a || item.a}</td>
                      <td className="p-4 text-slate-400">{item.option_b || item.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="mb-4 text-xl font-black">Find this service in your country</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(ctas.length ? ctas : [{ label: "Find support providers", href: "/directory" }, { label: "Post demand", href: "/load-board/post" }, { label: "Claim profile", href: "/claim" }]).map((cta, index) => (
                <Link key={index} href={cta.href || "/directory"} className="rounded-xl border border-slate-800 px-4 py-3 text-sm font-bold text-amber-300">
                  {cta.label || cta.service || cta.country || "Find support"}
                </Link>
              ))}
            </div>
          </section>

          {glossaryLinks.length ? (
            <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="mb-4 text-xl font-black">Related Glossary</h2>
              <div className="flex flex-wrap gap-2">
                {glossaryLinks.slice(0, 5).map((link, index) => (
                  <Link key={index} href={link.href || link.url || `/glossary/${link.term || ""}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    {link.label || link.term || "Glossary term"}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </main>
    </>
  );
}
