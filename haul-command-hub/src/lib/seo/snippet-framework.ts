// Haul Command — AI Snippet Steal Framework
// Generates structured content blocks designed to win Google Featured Snippets
// (paragraph, list, table, and definition snippets)

import { COUNTRIES, SEO_SERVICES, SNIPPET_TOPICS, CountryConfig } from '@/lib/seo-countries';

// ─── Snippet Types ───

export type SnippetType = 'paragraph' | 'list' | 'table' | 'definition';

export interface SnippetBlock {
    targetQuery: string;           // The search query we're targeting
    type: SnippetType;
    heading: string;               // h2 or h3 that triggers snippet extraction
    content: string;               // The actual content (HTML for tables, text for paragraphs)
    structuredData?: object;       // Optional JSON-LD to reinforce
}

// ─── Paragraph Snippet Generators ───
// Google pulls 40-60 word paragraph answers for "What is..." queries

export function generateParagraphSnippets(country: CountryConfig): SnippetBlock[] {
    const { name, terms, units, currency } = country;
    const measureUnit = units === 'imperial' ? 'feet' : 'metres';

    return [
        {
            targetQuery: `what is a ${terms.pilot_car.toLowerCase()} in ${name.toLowerCase()}`,
            type: 'paragraph',
            heading: `What Is a ${terms.pilot_car} in ${name}?`,
            content: `A ${terms.pilot_car} in ${name} is a specialized safety vehicle that escorts ${terms.oversize_load.toLowerCase()} shipments on public roads. The ${terms.pilot_car.toLowerCase()} travels ahead of or behind the oversized transport to warn other motorists, guide the driver through obstacles, and ensure compliance with local ${terms.permit.toLowerCase()} requirements. ${terms.pilot_car} operators must carry proper signage, amber warning lights, two-way radios, and height measurement equipment.`,
        },
        {
            targetQuery: `how much does a ${terms.escort_vehicle.toLowerCase()} cost in ${name.toLowerCase()}`,
            type: 'paragraph',
            heading: `How Much Does a ${terms.escort_vehicle} Cost in ${name}?`,
            content: `${terms.escort_vehicle} costs in ${name} typically range based on distance, route complexity, load dimensions, and the number of escorts required. Pricing is quoted in ${currency}. Urban routes generally cost more than highway runs due to slower speeds and traffic complexity. Rates may increase for night moves, weekend transport, or routes requiring police escort. Compare operators on Haul Command to find competitive rates.`,
        },
        {
            targetQuery: `${terms.oversize_load.toLowerCase()} requirements ${name.toLowerCase()}`,
            type: 'paragraph',
            heading: `${terms.oversize_load} Requirements in ${name}`,
            content: `In ${name}, a load is classified as ${terms.oversize_load.toLowerCase()} when it exceeds standard dimensional limits — typically 2.5–2.6 ${measureUnit} in width, 4.0–4.3 ${measureUnit} in height, or standard weight limits. Oversized loads require a ${terms.permit.toLowerCase()}, and depending on dimensions, one or more ${terms.escort_vehicle.toLowerCase()} vehicles may be mandated. ${terms.superload} classification applies to exceptionally large loads requiring engineering review.`,
        },
        {
            targetQuery: `how to get a ${terms.permit.toLowerCase()} in ${name.toLowerCase()}`,
            type: 'paragraph',
            heading: `How to Get a ${terms.permit} in ${name}`,
            content: `To obtain a ${terms.permit} in ${name}, submit an application with exact load dimensions, weight, proposed route, transport dates, proof of insurance, and vehicle specifications. Processing times range from 1–5 business days for standard permits to 2–8 weeks for ${terms.superload.toLowerCase()} classification. Maintain accurate records and apply during non-peak periods for faster processing.`,
        },
    ];
}

// ─── List Snippet Generators ───
// Google pulls numbered/bulleted lists for "how to" and "steps" queries

export function generateListSnippets(country: CountryConfig): SnippetBlock[] {
    const { name, terms } = country;

    return [
        {
            targetQuery: `${terms.pilot_car.toLowerCase()} requirements ${name.toLowerCase()}`,
            type: 'list',
            heading: `${terms.pilot_car} Requirements in ${name}`,
            content: [
                `Valid driver's license appropriate for the jurisdiction`,
                `Completion of certified ${terms.pilot_car.toLowerCase()} training courses`,
                `Oversized load signage (meeting local specification requirements)`,
                `Amber rotating or strobe warning lights`,
                `Two-way radio communication system`,
                `Height measurement equipment (typically extendable poles)`,
                `Traffic control flags and paddles`,
                `High-visibility safety clothing`,
                `Adequate liability insurance coverage`,
                `Knowledge of ${terms.permit.toLowerCase()} procedures`,
            ].map((item, i) => `${i + 1}. ${item}`).join('\n'),
        },
        {
            targetQuery: `how to become a ${terms.pilot_car.toLowerCase()} operator in ${name.toLowerCase()}`,
            type: 'list',
            heading: `How to Become a ${terms.pilot_car} Operator in ${name}`,
            content: [
                `Research your jurisdiction's specific licensing requirements`,
                `Complete an approved ${terms.pilot_car.toLowerCase()} training course`,
                `Obtain proper liability insurance`,
                `Equip your vehicle with required safety gear (signs, lights, flags, radios)`,
                `Register with relevant transport authorities`,
                `List your services on Haul Command to reach brokers and carriers`,
                `Build your reputation through on-time performance and proof bundles`,
            ].map((item, i) => `${i + 1}. ${item}`).join('\n'),
        },
        {
            targetQuery: `${terms.escort_vehicle.toLowerCase()} equipment list ${name.toLowerCase()}`,
            type: 'list',
            heading: `${terms.escort_vehicle} Equipment Checklist — ${name}`,
            content: [
                `Oversized Load signs (front and rear)`,
                `Amber strobe/rotating warning lights (roof-mounted)`,
                `Two-way radio or communication device`,
                `Height pole (extendable measuring device)`,
                `Traffic flags (red, standard size)`,
                `STOP/SLOW paddles`,
                `High-visibility vest (Class 2 or higher)`,
                `GPS navigation with oversize routing`,
                `First aid kit`,
                `Fire extinguisher`,
                `Reflective triangles / cones`,
                `Route maps and permit copies`,
            ].map((item) => `• ${item}`).join('\n'),
        },
    ];
}

// ─── Table Snippet Generators ───
// Google pulls <table> content for comparison queries

export function generateTableSnippets(country: CountryConfig): SnippetBlock[] {
    const { name, terms, units } = country;
    const measureUnit = units === 'imperial' ? 'ft' : 'm';
    const widthStd = units === 'imperial' ? '8.5' : '2.5';
    const widthOS = units === 'imperial' ? '8.5–12' : '2.5–3.5';
    const widthSuperOS = units === 'imperial' ? '12–16' : '3.5–5.0';
    const widthSuperload = units === 'imperial' ? '16+' : '5.0+';

    return [
        {
            targetQuery: `${terms.oversize_load.toLowerCase()} escort requirements ${name.toLowerCase()}`,
            type: 'table',
            heading: `${terms.escort_vehicle} Requirements by Load Size — ${name}`,
            content: `
| Load Width (${measureUnit}) | Classification | Front Escort | Rear Escort | Police Escort |
|---|---|---|---|---|
| Up to ${widthStd} | Standard | Not Required | Not Required | No |
| ${widthOS} | ${terms.oversize_load} | Required | Varies | No |
| ${widthSuperOS} | Wide ${terms.oversize_load} | Required | Required | Varies |
| ${widthSuperload} | ${terms.superload} | Required | Required | Often Required |
`.trim(),
        },
        {
            targetQuery: `${terms.permit.toLowerCase()} processing time ${name.toLowerCase()}`,
            type: 'table',
            heading: `${terms.permit} Processing Times — ${name}`,
            content: `
| Permit Type | Typical Processing Time | Validity |
|---|---|---|
| Single Trip | 1–3 business days | One movement |
| Annual/Blanket | 3–7 business days | 12 months |
| ${terms.superload} | 2–8 weeks | One movement |
| Multi-Jurisdiction | 5–15 business days | One movement |
`.trim(),
        },
    ];
}

// ─── Definition Snippet Generators ───
// Google pulls these for "X definition" or "X meaning" queries

export function generateDefinitionSnippets(country: CountryConfig): SnippetBlock[] {
    const { name, terms } = country;

    return [
        {
            targetQuery: `${terms.pilot_car.toLowerCase()} definition`,
            type: 'definition',
            heading: `${terms.pilot_car} Definition`,
            content: `A ${terms.pilot_car} is a vehicle that precedes or follows an ${terms.oversize_load.toLowerCase()} shipment to escort it safely through traffic, around obstacles, and through areas with restricted clearances. Also known as a "${terms.escort_vehicle.toLowerCase()}", the ${terms.pilot_car.toLowerCase()} operator communicates with the transport driver via radio and uses warning signs and lights to alert other road users.`,
        },
        {
            targetQuery: `${terms.superload.toLowerCase()} definition`,
            type: 'definition',
            heading: `What Is a ${terms.superload}?`,
            content: `A ${terms.superload} is an ${terms.oversize_load.toLowerCase()} shipment that exceeds even the standard oversize thresholds, requiring special engineering analysis, bridge reviews, and often police escort in addition to private ${terms.escort_vehicle.toLowerCase()} vehicles. ${terms.superload} classification in ${name} triggers the highest level of permitting, route planning, and escort requirements.`,
        },
    ];
}

// ─── All Snippets for a Country ───

export function getAllSnippetsForCountry(country: CountryConfig): SnippetBlock[] {
    return [
        ...generateParagraphSnippets(country),
        ...generateListSnippets(country),
        ...generateTableSnippets(country),
        ...generateDefinitionSnippets(country),
    ];
}

// ─── Global Snippet Inventory ───

export function getGlobalSnippetInventory(): {
    totalSnippets: number;
    byType: Record<SnippetType, number>;
    byCountry: { country: string; count: number }[];
} {
    let total = 0;
    const byType: Record<SnippetType, number> = {
        paragraph: 0,
        list: 0,
        table: 0,
        definition: 0,
    };
    const byCountry: { country: string; count: number }[] = [];

    for (const country of COUNTRIES) {
        const snippets = getAllSnippetsForCountry(country);
        total += snippets.length;
        byCountry.push({ country: country.name, count: snippets.length });
        for (const s of snippets) {
            byType[s.type]++;
        }
    }

    return { totalSnippets: total, byType, byCountry };
}
