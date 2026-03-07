// Haul Command — FAQ Data Generators (Server-safe)
// These generate FAQ data arrays for use in both server and client components

interface FAQItem {
    question: string;
    answer: string;
}

// ─── Country-level FAQ generator ───

export function generateCountryFAQs(country: {
    name: string;
    terms: {
        pilot_car: string;
        escort_vehicle: string;
        oversize_load: string;
        heavy_haul: string;
        permit: string;
        route_survey: string;
        superload: string;
    };
    currency: string;
    units: 'imperial' | 'metric';
}): FAQItem[] {
    const { name, terms, currency, units } = country;
    const measureUnit = units === 'imperial' ? 'feet' : 'metres';

    return [
        {
            question: `What is a ${terms.pilot_car} in ${name}?`,
            answer: `A ${terms.pilot_car} in ${name} is a specialized vehicle that escorts ${terms.oversize_load.toLowerCase()} shipments through traffic and challenging road conditions. These vehicles travel ahead of or behind the transport to warn motorists, guide the driver through tight spots, and ensure compliance with local ${terms.permit.toLowerCase()} requirements.`,
        },
        {
            question: `How much does a ${terms.escort_vehicle} cost in ${name}?`,
            answer: `${terms.escort_vehicle} costs in ${name} vary based on distance, load dimensions, route complexity, and the number of escorts required. Typical rates are quoted in ${currency} and depend on whether the movement is urban, highway, or cross-border. Contact operators on Haul Command to get competitive quotes instantly.`,
        },
        {
            question: `When is a ${terms.escort_vehicle} required for ${terms.oversize_load.toLowerCase()} in ${name}?`,
            answer: `In ${name}, a ${terms.escort_vehicle} is typically required when the load exceeds standard dimensional limits (width, height, length, or weight). Specific thresholds vary by region but generally start when width exceeds 2.5–3.5 ${measureUnit} or total weight exceeds standard road limits. Always verify with local authorities and check the ${terms.permit.toLowerCase()} requirements.`,
        },
        {
            question: `How do I find ${terms.pilot_car} operators in ${name}?`,
            answer: `Haul Command is the world's largest directory of ${terms.pilot_car} and ${terms.escort_vehicle} operators. Search by region, city, or corridor to find verified, available operators in ${name}. Each listing includes certifications, equipment details, response times, and reviews from other transport professionals.`,
        },
        {
            question: `What certifications are needed for ${terms.pilot_car} operators in ${name}?`,
            answer: `Certification requirements for ${terms.pilot_car} operators in ${name} vary by jurisdiction. Common requirements include a valid commercial driver's license, specific ${terms.pilot_car.toLowerCase()} training courses, proper vehicle equipment (flags, signs, lights, radios), liability insurance, and familiarity with ${terms.permit.toLowerCase()} procedures. Haul Command verifies operator qualifications to help you find compliant providers.`,
        },
        {
            question: `What equipment does a ${terms.pilot_car} need in ${name}?`,
            answer: `Standard ${terms.pilot_car} equipment in ${name} includes: oversize load signage, amber warning lights, two-way radios or communication devices, high-visibility vests, flags and paddles, height measuring poles, and GPS navigation. Requirements can vary by region, so always confirm local regulations.`,
        },
        {
            question: `Can I get a ${terms.route_survey} before my ${terms.heavy_haul.toLowerCase()} move in ${name}?`,
            answer: `Yes. A ${terms.route_survey} is a pre-transport inspection of the planned route to identify obstacles such as low bridges, narrow roads, sharp turns, utility lines, and weight-restricted bridges. Many ${terms.pilot_car} operators on Haul Command offer ${terms.route_survey.toLowerCase()} services to ensure your ${terms.heavy_haul.toLowerCase()} move goes smoothly.`,
        },
        {
            question: `How do I get a ${terms.permit} in ${name}?`,
            answer: `Obtaining a ${terms.permit} in ${name} typically involves submitting load dimensions, weight, route details, and transport dates to the relevant authority. Processing times vary by jurisdiction. Many Haul Command operators can assist with ${terms.permit.toLowerCase()} applications or connect you with permit services.`,
        },
    ];
}

// ─── Service-specific FAQ generator ───

export function generateServiceFAQs(
    serviceName: string,
    termKey: string,
    country: {
        name: string;
        terms: Record<string, string>;
        currency: string;
    }
): FAQItem[] {
    const localTerm = country.terms[termKey] || serviceName;

    return [
        {
            question: `What does ${localTerm} involve in ${country.name}?`,
            answer: `${localTerm} in ${country.name} involves professional escort and guidance for oversized or heavy shipments. This includes route planning, traffic management, communication with authorities, and real-time navigation support to ensure safe and legal transport.`,
        },
        {
            question: `How do I book ${localTerm} through Haul Command?`,
            answer: `You can search for ${localTerm} providers on Haul Command by entering your origin, destination, and load details. Our directory shows available operators with verified credentials, equipment specifications, and reviews. Contact them directly through the platform for quotes and scheduling.`,
        },
        {
            question: `What is the average cost for ${localTerm} in ${country.name}?`,
            answer: `Costs for ${localTerm} in ${country.name} depend on distance, route complexity, load dimensions, and the number of escorts required. Prices are quoted in ${country.currency}. Use Haul Command to compare multiple operators and get the most competitive rates.`,
        },
        {
            question: `Is ${localTerm} available 24/7 in ${country.name}?`,
            answer: `Many ${localTerm} operators listed on Haul Command offer 24/7 availability, especially for urgent or time-sensitive shipments. Filter by availability and response time to find operators ready to move when you need them.`,
        },
    ];
}

// ─── City-specific FAQ generator ───

export function generateCityFAQs(
    city: string,
    country: {
        name: string;
        terms: {
            pilot_car: string;
            escort_vehicle: string;
            oversize_load: string;
        };
    }
): FAQItem[] {
    const { terms } = country;

    return [
        {
            question: `How do I find a ${terms.pilot_car} near ${city}?`,
            answer: `Haul Command lists verified ${terms.pilot_car} operators in and around ${city}, ${country.name}. Our directory includes contact information, service areas, equipment details, and reviews. Search by location to find the nearest available operator.`,
        },
        {
            question: `What ${terms.oversize_load.toLowerCase()} routes run through ${city}?`,
            answer: `${city} is a key hub for ${terms.oversize_load.toLowerCase()} transport in ${country.name}. Common corridors include major highways and industrial routes connecting ${city} to port facilities, construction sites, and manufacturing centers. Haul Command's corridor intelligence helps you plan the optimal route.`,
        },
        {
            question: `Are there specific ${terms.oversize_load.toLowerCase()} restrictions in ${city}?`,
            answer: `Yes, ${city} may have specific restrictions on ${terms.oversize_load.toLowerCase()} movements including time-of-day limitations, restricted streets, bridge weight limits, and height clearances. Always verify current local regulations and consider using a ${terms.pilot_car.toLowerCase()} operator familiar with ${city}'s infrastructure.`,
        },
    ];
}
