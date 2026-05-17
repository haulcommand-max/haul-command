import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AeoAnswerCard } from "@/components/seo/AeoAnswerCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQPageJsonLd, buildQAPageJsonLd } from "@/lib/seo/jsonld";
import {
  buildLocaleCityServiceCanonical,
  buildLocaleCityServicePath,
  cityServiceIndexabilityScore,
  countryFromLocale,
  getCityServiceDefinition,
  shouldIndexCityServicePage,
  titleizeRoutePart,
  type CityServiceRouteParams,
} from "@/lib/seo/locale-city-service";

type PageProps = {
  params: Promise<CityServiceRouteParams>;
};

function displayName(record: any) {
  return record.company_name || record.company || record.name || record.display_name || "Indexed support record";
}

function recordId(record: any) {
  return record.contact_id || record.canonical_entity_id || record.entity_id || record.id;
}

async function fetchCityServiceRecords(params: CityServiceRouteParams) {
  const supabase = createClient();
  const service = getCityServiceDefinition(params.service);
  const countryCode = countryFromLocale(params.locale);
  const region = params.region.toUpperCase();
  const city = titleizeRoutePart(params.city);

  try {
    let query = supabase
      .from("v_directory_operators")
      .select("*")
      .eq("country_code", countryCode)
      .or(`city.ilike.%${city}%,city_inferred.ilike.%${city}%`)
      .limit(24);

    if (region) {
      query = query.or(`state.eq.${region},state_inferred.eq.${region},state_code.eq.${region},admin1_code.eq.${region}`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[locale-city-service] directory query failed:", error.message);
      return [];
    }

    return (data ?? []).filter((record: any) => {
      const subtype = String(record.entity_subtype || record.entity_type || "").toLowerCase();
      const services = JSON.stringify(record.services || record.specialties || record.service_categories || []).toLowerCase();
      return service.entitySubtypes.some((item) => subtype === item || subtype.includes(item))
        || service.searchTerms.some((term) => services.includes(term));
    });
  } catch (error) {
    console.warn("[locale-city-service] directory query exception:", error);
    return [];
  }
}

function buildPageFacts(params: CityServiceRouteParams, providerCount: number) {
  const service = getCityServiceDefinition(params.service);
  const city = titleizeRoutePart(params.city);
  const region = params.region.toUpperCase();
  const countryCode = countryFromLocale(params.locale);
  const canonical = buildLocaleCityServiceCanonical(params);
  const score = cityServiceIndexabilityScore({
    providerCount,
    hasServiceDefinition: Boolean(service),
    hasRegion: Boolean(region),
    hasCity: Boolean(city),
    hasNoDeadEndActions: true,
    hasFaq: true,
    hasInternalLinks: true,
  });

  return { service, city, region, countryCode, canonical, score, shouldIndex: shouldIndexCityServicePage(score, providerCount) };
}

function buildDirectAnswer(facts: ReturnType<typeof buildPageFacts>, providerCount: number, relativePath: string) {
  const question = `Who provides ${facts.service.shortLabel.toLowerCase()} in ${facts.city}, ${facts.region}?`;
  const hasCoverage = providerCount > 0;

  return {
    question,
    answer: hasCoverage
      ? `Haul Command indexes ${providerCount} source-backed support record${providerCount === 1 ? "" : "s"} for ${facts.service.shortLabel.toLowerCase()} in ${facts.city}, ${facts.region}. Compare each record's proof, claim state, and freshness before dispatching a move.`
      : `Haul Command does not yet have enough source-backed ${facts.service.shortLabel.toLowerCase()} records in ${facts.city}, ${facts.region}. This page stays noindex until useful local supply signals exist, while claim and post-load actions keep the market from becoming a dead end.`,
    confidenceLabel: hasCoverage ? "Source-backed local coverage" : "Sparse market - noindex",
    sourceLabel: "Haul Command directory facade",
    sourceHref: `/directory?country=${facts.countryCode}&category=${facts.service.category}&q=${encodeURIComponent(facts.city)}`,
    ctaLabel: hasCoverage ? "Build support packet" : "Post support request",
    ctaHref: hasCoverage
      ? `/loads/post?market=${encodeURIComponent(relativePath)}&service=${facts.service.slug}`
      : `/loads/post?market=${encodeURIComponent(relativePath)}&service=${facts.service.slug}&intent=market-gap`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const records = await fetchCityServiceRecords(resolved);
  const facts = buildPageFacts(resolved, records.length);

  return {
    title: `${facts.service.label} in ${facts.city}, ${facts.region} | Haul Command`,
    description: `Find ${facts.service.shortLabel.toLowerCase()} in ${facts.city}, ${facts.region}. Compare indexed support records, coverage signals, claim paths, and dispatch-ready next actions without fake availability claims.`,
    alternates: {
      canonical: facts.canonical,
      languages: {
        [resolved.locale]: facts.canonical,
        "x-default": buildLocaleCityServiceCanonical({ ...resolved, locale: "en-us" }),
      },
    },
    robots: facts.shouldIndex ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${facts.service.label} in ${facts.city}, ${facts.region}`,
      description: `${records.length} indexed support records and no-dead-end actions for ${facts.service.shortLabel.toLowerCase()} in ${facts.city}.`,
      url: facts.canonical,
    },
  };
}

export default async function LocaleCityServicePage({ params }: PageProps) {
  const resolved = await params;
  const records = await fetchCityServiceRecords(resolved);
  const facts = buildPageFacts(resolved, records.length);
  const relativePath = buildLocaleCityServicePath(resolved);
  const directAnswer = buildDirectAnswer(facts, records.length, relativePath);
  const visibleFaqs = [
    {
      question: `How many ${facts.service.shortLabel.toLowerCase()} are indexed in ${facts.city}?`,
      answer: records.length >= 1
        ? `Haul Command currently shows ${records.length} indexed support record${records.length === 1 ? "" : "s"} for ${facts.service.shortLabel.toLowerCase()} in ${facts.city}, ${facts.region}. Verify claim, contact, and freshness before dispatch.`
        : `Haul Command is still building source-backed ${facts.service.shortLabel.toLowerCase()} coverage in ${facts.city}, ${facts.region}. Use the claim and post-load actions to create demand without inventing supply.`,
    },
    {
      question: `Can I book ${facts.service.shortLabel.toLowerCase()} from this page?`,
      answer: "Use the listed profile actions when records exist, or post a load support request so dispatch can build a support packet around the route, dimensions, and timing.",
    },
  ];
  const faqJsonLd = buildFAQPageJsonLd({
    url: facts.canonical,
    faqs: visibleFaqs.map((faq) => ({ ...faq, visible: true })),
  });
  const qaJsonLd = buildQAPageJsonLd({
    url: facts.canonical,
    question: directAnswer.question,
    answer: directAnswer.answer,
    visible: true,
  });
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${facts.canonical}#service`,
      name: `${facts.service.label} in ${facts.city}, ${facts.region}`,
      serviceType: facts.service.label,
      areaServed: {
        "@type": "City",
        name: facts.city,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: facts.region,
        },
      },
      provider: {
        "@type": "Organization",
        name: "Haul Command",
        url: "https://www.haulcommand.com",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Directory", item: "https://www.haulcommand.com/directory" },
        { "@type": "ListItem", position: 2, name: facts.countryCode, item: `https://www.haulcommand.com/directory/${facts.countryCode.toLowerCase()}` },
        { "@type": "ListItem", position: 3, name: facts.city, item: facts.canonical },
      ],
    },
    ...(qaJsonLd ? [qaJsonLd] : []),
    ...(faqJsonLd ? [faqJsonLd] : []),
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <JsonLd data={jsonLd} />
      <section className="border-b border-[#C6923A]/25 bg-black px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#C6923A]">
            Locale-first market page
          </div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
            {facts.service.label} in <span className="text-[#C6923A]">{facts.city}, {facts.region}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#d8c6a3]">
            Compare indexed support records, coverage context, claim paths, and dispatch next actions for {facts.service.shortLabel.toLowerCase()} in this market. Thin markets are labeled conservatively and kept out of the index until enough useful signals exist.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">{records.length} support records</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">Indexability score {facts.score}/7</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">{facts.shouldIndex ? "Indexable" : "Noindex until seeded"}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <AeoAnswerCard
            question={directAnswer.question}
            answer={directAnswer.answer}
            confidenceLabel={directAnswer.confidenceLabel}
            sourceLabel={directAnswer.sourceLabel}
            sourceHref={directAnswer.sourceHref}
            ctaLabel={directAnswer.ctaLabel}
            ctaHref={directAnswer.ctaHref}
            facts={[
              { label: "Records", value: records.length },
              { label: "Index gate", value: facts.shouldIndex ? "Indexable" : "Noindex" },
              { label: "Service", value: facts.service.shortLabel },
            ]}
          />
          {records.length > 0 ? records.slice(0, 12).map((record: any) => (
            <article key={recordId(record)} className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#C6923A]">Indexed support record</div>
              <h2 className="mt-2 text-xl font-black">{displayName(record)}</h2>
              <p className="mt-2 text-sm text-[#d8c6a3]">
                {[record.city_inferred || record.city || facts.city, record.state_inferred || record.state || facts.region].filter(Boolean).join(", ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="rounded-lg bg-[#C6923A] px-4 py-2 text-sm font-black text-black" href={`/directory/dossier/${recordId(record)}`}>
                  View profile
                </Link>
                <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white" href={`/loads/post?support=${encodeURIComponent(recordId(record))}&market=${encodeURIComponent(relativePath)}`}>
                  Build support packet
                </Link>
              </div>
            </article>
          )) : (
            <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-6">
              <h2 className="text-2xl font-black">No source-backed supply shown yet for this market</h2>
              <p className="mt-3 text-sm leading-6 text-[#fff7e8]">
                This page is still useful as a demand-capture surface, but it is noindexed until enough market signals exist. Providers can claim the market and brokers can post the load instead of seeing a dead end.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="rounded-lg bg-[#C6923A] px-4 py-2 text-sm font-black text-black" href={`/claim?market=${encodeURIComponent(relativePath)}&intent=city-service-gap`}>
                  Claim this market
                </Link>
                <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white" href={`/loads/post?market=${encodeURIComponent(relativePath)}&service=${facts.service.slug}`}>
                  Post support request
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[#C6923A]/25 bg-black/55 p-5">
            <h2 className="text-lg font-black">Next actions</h2>
            <div className="mt-4 grid gap-2">
              <Link className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold" href={`/directory?country=${facts.countryCode}&category=${facts.service.category}&q=${encodeURIComponent(facts.city)}`}>
                Search broader directory
              </Link>
              <Link className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold" href="/tools/escort-count-calculator">
                Check escort count
              </Link>
              <Link className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold" href="/shortage-index">
                View shortage index
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-lg font-black">FAQ</h2>
            <div className="mt-4 space-y-3">
              {visibleFaqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-sm font-black text-white">{faq.question}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#d8c6a3]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
