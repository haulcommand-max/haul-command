import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    getCountryBySlug,
    getAllCountrySlugs,
    SNIPPET_TOPICS,
} from '@/lib/seo-countries';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';
import { generateGuideHreflang } from '@/lib/seo/hreflang';

// ─── Static Params (CAPPED: US only to stay under 80MB limit) ───
export function generateStaticParams() {
    const paths: { country: string; slug: string }[] = [];
    // Only pre-render US guides — highest SEO value
    for (const topic of SNIPPET_TOPICS) {
        paths.push({ country: 'us', slug: topic.slug });
    }
    return paths;
}

// ─── Metadata ───
export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string; slug: string }>;
}): Promise<Metadata> {
    const { country: countrySlug, slug: topicSlug } = await params;
    const country = getCountryBySlug(countrySlug);
    const topic = SNIPPET_TOPICS.find((t) => t.slug === topicSlug);

    if (!country || !topic) return { title: 'Not Found' };

    const localTerm = country.terms[topic.termKey] || topic.title;
    const title = `${topic.title} in ${country.name} — ${localTerm} Guide`;
    const description = `Complete guide to ${localTerm.toLowerCase()} in ${country.name}. Learn about requirements, costs, certifications, and how to find verified operators. Updated for ${new Date().getFullYear()}.`;

    return {
        title,
        description,
        keywords: [
            `${localTerm} ${country.name}`,
            `what is a ${localTerm.toLowerCase()}`,
            `${localTerm.toLowerCase()} cost`,
            `${localTerm.toLowerCase()} requirements`,
            `${country.terms.oversize_load} ${country.name}`,
        ],
        openGraph: {
            title,
            description,
            url: `https://haulcommand.com/${countrySlug}/guide/${topicSlug}`,
            siteName: 'Haul Command',
            type: 'article',
        },
        alternates: {
            canonical: `https://haulcommand.com/${countrySlug}/guide/${topicSlug}`,
            languages: generateGuideHreflang(topicSlug),
        },
    };
}

// ─── Guide Content Generators ───
function getGuideContent(topicSlug: string, country: ReturnType<typeof getCountryBySlug>) {
    if (!country) return { sections: [] };

    const { terms, name, cities, regions, units, currency, equipment_focus } = country;
    const measureUnit = units === 'imperial' ? 'feet' : 'metres';

    const contentMap: Record<string, { sections: { title: string; body: string }[] }> = {
        'what-is-a-pilot-car': {
            sections: [
                {
                    title: `What Is a ${terms.pilot_car}?`,
                    body: `A ${terms.pilot_car} (also known as a "${terms.escort_vehicle}") is a specialized vehicle that escorts ${terms.oversize_load.toLowerCase()} shipments in ${name}. These vehicles are essential for safely navigating ${terms.oversize_load.toLowerCase()} transport through areas with tight clearances, narrow roads, bridges, and heavy traffic. The ${terms.pilot_car.toLowerCase()} operator communicates with the truck driver via two-way radio to guide them through challenging sections of the route.`,
                },
                {
                    title: `${terms.pilot_car} Requirements in ${name}`,
                    body: `In ${name}, ${terms.pilot_car.toLowerCase()} operators must meet specific requirements that vary by region. Common requirements include: a valid driver's license appropriate for the jurisdiction, completion of certified ${terms.pilot_car.toLowerCase()} training courses, proper vehicle equipment including oversize load signage, amber warning lights, two-way radios, height measuring equipment, and flags/paddles. Operators must also carry adequate liability insurance and be familiar with ${terms.permit.toLowerCase()} procedures in ${regions.slice(0, 5).join(', ')}, and other regions.`,
                },
                {
                    title: `When Is a ${terms.pilot_car} Required?`,
                    body: `A ${terms.pilot_car.toLowerCase()} is typically required in ${name} when a shipment exceeds standard dimensional limits. The specific thresholds vary by region, but generally a single escort is needed when width exceeds 3.0–3.5 ${measureUnit}, and two escorts (front and rear) when width exceeds 4.0–5.0 ${measureUnit}. Height, length, and weight thresholds also apply. Night moves, weekend restrictions, and route-specific requirements may mandate additional escorts. Popular transport corridors in ${name} include routes connecting ${cities.slice(0, 4).join(', ')}.`,
                },
                {
                    title: `How to Find a ${terms.pilot_car} in ${name}`,
                    body: `Haul Command is the world's largest directory of ${terms.pilot_car.toLowerCase()} operators. Search by city (${cities.slice(0, 5).join(', ')}), region, or transport corridor to find verified operators in ${name}. Each listing includes certifications, equipment details, service area, response times, and reviews from other transport professionals. You can filter by availability, equipment type (${equipment_focus.slice(0, 3).join(', ')}), and experience level.`,
                },
            ],
        },
        'what-is-an-escort-vehicle': {
            sections: [
                {
                    title: `What Is an ${terms.escort_vehicle}?`,
                    body: `An ${terms.escort_vehicle.toLowerCase()} in ${name} is a vehicle specifically equipped and operated to accompany ${terms.oversize_load.toLowerCase()} transport. While often used interchangeably with "${terms.pilot_car.toLowerCase()}", the term "${terms.escort_vehicle.toLowerCase()}" specifically refers to the professional service of guiding oversized shipments safely through traffic, around obstacles, and through areas with restricted clearances. In ${name}, ${terms.escort_vehicle.toLowerCase()} services are regulated and operators must meet certification standards.`,
                },
                {
                    title: `${terms.escort_vehicle} vs ${terms.pilot_car} in ${name}`,
                    body: `In ${name}, the terms "${terms.escort_vehicle.toLowerCase()}" and "${terms.pilot_car.toLowerCase()}" are often used to describe the same service, though there can be distinctions depending on the jurisdiction. Generally, a "${terms.pilot_car.toLowerCase()}" travels ahead of the load to scout the route and warn oncoming traffic, while a rear escort follows behind to protect the transport from trailing vehicles. Some jurisdictions in ${name} define specific roles and equipment requirements for front and rear escort positions.`,
                },
                {
                    title: `Equipment Standards`,
                    body: `${terms.escort_vehicle} operators in ${name} must equip their vehicles with: oversized load signage (meeting local specification requirements), amber rotating or strobe warning lights, two-way radio communication systems, height measurement equipment (typically extendable poles), traffic control flags and paddles, high-visibility clothing, and GPS navigation systems. All equipment must comply with ${name}'s transport regulations and be maintained in working condition.`,
                },
            ],
        },
        'oversize-load-requirements': {
            sections: [
                {
                    title: `${terms.oversize_load} Requirements in ${name}`,
                    body: `${terms.oversize_load} transport in ${name} is subject to strict regulations governing dimensions, weight, route planning, escort requirements, and ${terms.permit.toLowerCase()} procedures. These regulations exist to protect road infrastructure, ensure public safety, and minimize traffic disruption. Requirements can vary significantly between regions (${regions.slice(0, 4).join(', ')}), so operators must verify specific rules for each jurisdiction their route passes through.`,
                },
                {
                    title: `Dimensional Limits`,
                    body: `Standard dimensional limits in ${name} define the maximum width, height, length, and weight a vehicle can be before it's classified as an ${terms.oversize_load.toLowerCase()}. Typical thresholds are: Width: 2.5–2.6 ${measureUnit}, Height: 4.0–4.3 ${measureUnit}, Length: 18–23 ${measureUnit} (for semi-trailers). Loads exceeding these dimensions require a ${terms.permit.toLowerCase()} and may need one or more ${terms.escort_vehicle.toLowerCase()} vehicles depending on the degree of excess.`,
                },
                {
                    title: `${terms.permit} Process`,
                    body: `To transport an ${terms.oversize_load.toLowerCase()} in ${name}, you must obtain a ${terms.permit.toLowerCase()}. The application typically requires: exact load dimensions and weight, proposed route with alternatives, transport date and time window, proof of insurance, vehicle specifications, and escort arrangements if required. Processing times vary from 24 hours to several weeks depending on the load classification and number of jurisdictions involved.`,
                },
                {
                    title: `Escort Requirements by Load Size`,
                    body: `${name} typically requires escorts based on load dimensions: loads up to moderate oversize may need a single front ${terms.pilot_car.toLowerCase()}, larger loads require both front and rear escorts, and ${terms.superload.toLowerCase()} classification may require police escort in addition to private ${terms.escort_vehicle.toLowerCase()} vehicles. Some jurisdictions also restrict travel to specific times (typically early morning or off-peak hours) and prohibit movement during holidays or severe weather.`,
                },
            ],
        },
        'escort-vehicle-cost': {
            sections: [
                {
                    title: `${terms.escort_vehicle} Cost Guide — ${name}`,
                    body: `The cost of ${terms.escort_vehicle.toLowerCase()} services in ${name} depends on several factors including distance, route complexity, load dimensions, number of escorts required, and time of transport. All pricing is typically in ${currency}. Urban moves generally cost more than highway runs due to traffic complexity and slower speeds.`,
                },
                {
                    title: `Pricing Factors`,
                    body: `Key factors affecting ${terms.escort_vehicle.toLowerCase()} costs in ${name}: 1) Distance — longer routes cost more but per-${units === 'imperial' ? 'mile' : 'kilometre'} rates decrease. 2) Number of escorts — single vs. dual vs. triple escort. 3) Route complexity — urban areas, bridge crossings, and mountain passes increase costs. 4) Time restrictions — night or weekend moves may carry surcharges. 5) Equipment type — ${equipment_focus.slice(0, 3).join(', ')} may require specialized escort vehicles. 6) ${terms.permit.toLowerCase()} assistance — some operators include permit coordination.`,
                },
                {
                    title: `How to Get the Best Rate`,
                    body: `To get competitive ${terms.escort_vehicle.toLowerCase()} rates in ${name}: compare multiple operators on Haul Command, book in advance when possible, provide accurate load details for precise quoting, consider bundling services (${terms.route_survey.toLowerCase()} + escort), and use Haul Command's corridor intelligence to find operators already positioned near your origin in ${cities.slice(0, 4).join(', ')} or other key cities.`,
                },
            ],
        },
        'heavy-haul-permits': {
            sections: [
                {
                    title: `${terms.permit} Guide for ${name}`,
                    body: `Obtaining the correct ${terms.permit.toLowerCase()} is a critical step for any ${terms.heavy_haul.toLowerCase()} or ${terms.oversize_load.toLowerCase()} movement in ${name}. This guide covers the permit types, application process, timelines, and common pitfalls to help you navigate the regulatory landscape efficiently.`,
                },
                {
                    title: `Types of Permits`,
                    body: `${name} typically offers several categories of transport permits: single-trip permits (for one specific movement), annual/blanket permits (for frequent shippers moving similar loads), ${terms.superload.toLowerCase()} permits (for exceptionally large or heavy loads requiring special engineering review), and multi-jurisdiction permits (when your route crosses regional boundaries within ${name}). Each type has different requirements, processing times, and costs.`,
                },
                {
                    title: `Application Requirements`,
                    body: `A standard ${terms.permit.toLowerCase()} application in ${name} requires: complete vehicle specifications (tractor, trailer, load), exact dimensions (width, height, length, overhang), gross and axle weights, proposed route with start and end points, preferred travel dates and times, proof of insurance, and operator certification details. For ${terms.superload.toLowerCase()} applications, you may also need engineering analyses for bridges and road structures along the route.`,
                },
                {
                    title: `Processing Times & Tips`,
                    body: `Standard ${terms.permit.toLowerCase()} applications in ${name} are typically processed within 1–5 business days. ${terms.superload.toLowerCase()} permits may take 2–8 weeks due to engineering reviews. Tips for faster processing: submit complete and accurate applications, apply during non-peak periods, maintain good standing with permitting authorities, and consider using permit services available through Haul Command operators in ${cities.slice(0, 3).join(', ')} and across ${name}.`,
                },
            ],
        },
    };

    return contentMap[topicSlug] || { sections: [] };
}

// ─── Guide Page ───
export default async function GuidePage({
    params,
}: {
    params: Promise<{ country: string; slug: string }>;
}) {
    const { country: countrySlug, slug: topicSlug } = await params;
    const country = getCountryBySlug(countrySlug);
    const topic = SNIPPET_TOPICS.find((t) => t.slug === topicSlug);

    if (!country || !topic) notFound();

    const localTerm = country.terms[topic.termKey] || topic.title;
    const content = getGuideContent(topicSlug, country);
    const baseUrl = 'https://haulcommand.com';

    // Generate FAQs from content sections
    const faqs = content.sections.map((section) => ({
        question: section.title,
        answer: section.body,
    }));

    return (
        <>
            <FAQSchema faqs={faqs} />
            <BreadcrumbSchema
                items={[
                    { name: 'Haul Command', url: baseUrl },
                    { name: country.name, url: `${baseUrl}/${countrySlug}` },
                    { name: 'Guides', url: `${baseUrl}/${countrySlug}` },
                    { name: topic.title, url: `${baseUrl}/${countrySlug}/guide/${topicSlug}` },
                ]}
            />

            <Navbar />

            <main className="min-h-screen bg-[#0a0e17]">
                {/* ─── Hero ─── */}
                <section className="relative pt-24 pb-12 bg-gradient-to-b from-emerald-600/10 to-transparent">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
                        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
                            <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
                            <span className="text-slate-600">/</span>
                            <Link href={`/${countrySlug}`} className="hover:text-white transition-colors">{country.flag} {country.name}</Link>
                            <span className="text-slate-600">/</span>
                            <span className="text-white">Guide</span>
                        </nav>

                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                📖 Knowledge Guide
                            </span>
                            <span className="text-xs text-slate-500">
                                Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
                            {topic.title}
                            <br />
                            <span className="text-slate-300">in {country.name} {country.flag}</span>
                        </h1>

                        <p className="text-lg text-slate-300 leading-relaxed">
                            Complete guide to {localTerm.toLowerCase()} in {country.name}.
                            Covering requirements, costs, regulations, and how to find verified operators.
                        </p>
                    </div>
                </section>

                {/* ─── Table of Contents ─── */}
                <section className="py-8 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                In This Guide
                            </h2>
                            <ol className="space-y-2">
                                {content.sections.map((section, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-400 font-mono text-sm mt-0.5">{index + 1}.</span>
                                        <a
                                            href={`#section-${index}`}
                                            className="text-slate-300 hover:text-white transition-colors text-sm"
                                        >
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>

                {/* ─── Content Sections ─── */}
                <section className="py-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
                        {content.sections.map((section, index) => (
                            <article key={index} id={`section-${index}`} className="scroll-mt-24">
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    {section.title}
                                </h2>
                                <div className="text-slate-300 leading-relaxed text-lg">
                                    {section.body}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ─── Related Guides ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-xl font-bold text-white mb-6">
                            More Guides for {country.name}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {SNIPPET_TOPICS.filter((t) => t.slug !== topicSlug).map((t) => (
                                <Link
                                    key={t.slug}
                                    href={`/${countrySlug}/guide/${t.slug}`}
                                    className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200"
                                >
                                    <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                                        {t.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {country.terms[t.termKey] || t.title} in {country.name}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ─── */}
                <section className="py-16 bg-gradient-to-t from-blue-950/30 to-transparent border-t border-white/5">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Need a {localTerm} in {country.name}?
                        </h2>
                        <p className="text-slate-300 mb-6">
                            Search verified {localTerm.toLowerCase()} operators across {country.name} on Haul Command.
                        </p>
                        <Link
                            href={`/${countrySlug}`}
                            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                        >
                            Find Operators in {country.name} →
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}
