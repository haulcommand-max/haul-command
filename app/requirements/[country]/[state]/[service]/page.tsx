import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Haul Command Global Intelligence Unit
// Dynamic Tier A-E SEO Requirement Shell Generator
// Route: /requirements/[country]/[state]/[service]

type Props = {
  params: {
    country: string; // e.g. "au" or "us" or "de"
    state: string;   // e.g. "nsw" or "tx" or "bw"
    service: string; // e.g. "pilot-vehicle" or "high-pole" or "bf3"
  }
}

// 1. Generate Metadata dynamically based on mapped local terms
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state, service } = params;
  
  // Here we would dynamically query hc_localized_capabilities 
  // where country_iso2 = country.toUpperCase() and local_slug = service
  
  // Example Fallback Mock Data:
  const isAus = country.toLowerCase() === 'au';
  const serviceName = isAus ? (service.includes('pilot') ? 'Pilot Vehicle' : 'MSIC Access') : 'Pilot Car';
  const locationName = state.toUpperCase();

  return {
    title: `${serviceName} Requirements & Regulations in ${locationName} | Haul Command`,
    description: `Current legal thresholds, dimension requirements, and verified ${serviceName} operators in ${locationName}, ${country.toUpperCase()}.`,
    alternates: {
      canonical: `https://www.haulcommand.com/requirements/${country}/${state}/${service}`,
    }
  };
}

export default async function RequirementServicePage({ params }: Props) {
  const { country, state, service } = params;

  // 1. Fetch Local Terminology
  // const localizedConfig = await getLocalizedCapability(country, service);
  
  // 2. Fetch Numeric Thresholds (From NTS extraction plan)
  // const limits = await getJurisdictionRequirements(country, state);

  // 3. Fetch Top 3 Operators (From Freedom Pilot extraction plan)
  // const topOperators = await getTopVerifiedOperators(country, state, localizedConfig.universalCapability);

  // 4. Schema org (From Evergreen extraction plan)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `At what width is a ${service} required in ${state.toUpperCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `According to the current rules in ${state.toUpperCase()}, a load wider than X meters (or Y feet) requires a front escort.` // Dynamic insertion here
        }
      }
    ]
  };

  return (
    <div className="bg-hc-gray-900 min-h-screen text-hc-gray-50">
      {/* 1. Schema Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* 2. Primary Navigation / Breadcrumbs */}
      <nav className="p-4 border-b border-hc-gray-800 text-sm">
        Home / Requirements / {country.toUpperCase()} / {state.toUpperCase()} / {service}
      </nav>

      {/* 3. The Requirement Command Center (NTS Strategy) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl border-l-4 border-hc-yellow-400 pl-6">
            {state.toUpperCase()} Legal Load Limits & Escort Requirements
          </h1>
          <p className="mt-4 text-xl text-hc-gray-300 max-w-3xl">
            Live database of heavy haul rules and trusted capabilities for {service} in {state.toUpperCase()}. Last verified today.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 4. Live Calculator (The NTS 15x Play) */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-hc-gray-800 rounded-xl p-8 border border-hc-gray-700">
              <h2 className="text-2xl font-bold mb-4">Live Threshold Calculator</h2>
              {/* This replaces generic text with a utility */}
              <div className="bg-hc-gray-900 rounded p-6 shadow-inner italic text-hc-gray-400">
                {/* Interactive React Component — RequirementCalculator placeholder */}
                {/* <RequirementCalculator jurisdiction={state} /> */}
              </div>
            </section>

            {/* 5. Vendor Compliance Block (The Freedom Pilot 15x Play) */}
            <section className="bg-hc-gray-800 rounded-xl p-8 border border-hc-gray-700">
              <h2 className="text-2xl font-bold mb-4">Required Credentials</h2>
              <ul className="list-disc pl-5 space-y-2 text-hc-gray-300">
                <li>Local commercial liability insurance requirements</li>
                <li>Verify operators hold the required {state.toUpperCase()} regional pass</li>
              </ul>
            </section>
          </div>

          {/* 6. Operator Matching Sidebar (The Monetization/Booking Layer) */}
          <div className="space-y-6">
            <div className="bg-hc-yellow-400 text-hc-gray-900 rounded-xl p-6 shadow-xl">
              <h3 className="font-bold text-xl mb-2">Need a {service.toUpperCase()} near {state.toUpperCase()}?</h3>
              <p className="mb-4 text-sm font-medium">Bypass the search. Request dispatch across our verified B2B network.</p>
              <button className="w-full bg-hc-gray-900 text-hc-yellow-400 font-bold py-3 rounded hover:bg-black transition-colors">
                Request Unified Dispatch
              </button>
            </div>

            {/* Trust Signals Block (Evergreen Strategy) */}
            <div className="bg-hc-gray-800 rounded-xl p-6 border border-hc-gray-700 text-sm">
              <h4 className="text-hc-gray-100 font-bold mb-2">Verified Coverage</h4>
              <p className="text-hc-gray-400">
                Escorts matched through this portal pass our strict credential wallet checks, preventing expired port passes or suspended operators from accepting loads.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
