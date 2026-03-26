import React from "react";
import { Metadata } from "next";

// The 57 Tiered Growth Countries defined in Haul Command expansion specs
const TIERED_COUNTRIES = [
  // Tier A (Gold) - Primary execution markets
  "US", "CA", "AU", "GB", "NZ", "ZA", "DE", "NL", "AE", "BR",
  // Tier B (Blue)
  "IE", "SE", "NO", "DK", "FI", "CH", "AT", "FR", "BE", "MX",
  "CL", "PE", "CO", "SA", "QA",
  // Tier C (Silver) 
  "IT", "ES", "PL", "CZ", "RO", "HU", "GR", "TR", "IN", "MY",
  "SG", "ID", "PH", "VN", "TH", "KR", "JP", "TW", "HK",
  // Emerging (Steel)
  "AR", "ZA", "NG", "KE", "EG", "MA", "IL", "KW", "OM", "BH",
  "UY", "PY"
];

// Map codes to display names (Sample mappings, can enhance later)
const countryNames: Record<string, string> = {
  "US": "United States",
  "CA": "Canada",
  "AU": "Australia",
  "GB": "United Kingdom",
  "DE": "Germany",
  // Add fallback logic for the rest
};

// 1. GENERATE STATIC PARAMS: Build these 57 pages at compile time!
export async function generateStaticParams() {
  // Removes standard duplicate codes if accidentally mapped
  const uniqueCodes = Array.from(new Set(TIERED_COUNTRIES));
  
  return uniqueCodes.map((code) => ({
    countryCode: code.toLowerCase(),
  }));
}

// 2. DYNAMIC SEO METADATA GENERATOR
export async function generateMetadata({ params }: { params: { countryCode: string } }): Promise<Metadata> {
  const code = params.countryCode.toUpperCase();
  const countryName = countryNames[code] || code;

  return {
    title: `Pilot Cars & Escort Vehicles in ${countryName} | Haul Command`,
    description: `Search the definitive directory for certified pilot cars and oversize load escort vehicles across ${countryName}. Verified, rated, and active in the Haul Command global network.`,
    alternates: {
      canonical: `https://haulcommand.com/directory/${code.toLowerCase()}`
    }
  };
}

// 3. PURE RSC (React Server Component) PAGE TEMPLATE
export default function CountryDirectoryPage({ params }: { params: { countryCode: string } }) {
  const code = params.countryCode.toUpperCase();
  const countryName = countryNames[code] || code;

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            {countryName} Escort Vehicle Directory
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Browse certified pilot cars, pole cars, and steer operators across {countryName}. The definitive global logistics network.
          </p>
        </header>
        
        {/* Placeholder for the interactive Map or FilterDropdowns (Loaded via Client Component later) */}
        <div className="bg-slate-900 shadow rounded-xl p-8 text-center border border-slate-800">
           <p className="text-emerald-400 font-mono">
             [ SEO Scaffold Activated ] 
             <br/><br/>
             This route (`/directory/{code.toLowerCase()}`) was statically compiled during build.
             Sub-components (Load Board / Directory Search) will hydrate here on client load.
           </p>
        </div>
      </div>
    </div>
  );
}
