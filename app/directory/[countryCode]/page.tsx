import React from "react";
import { Metadata } from "next";

// The 57 Tiered Growth Countries defined in Haul Command expansion specs
const TIERED_COUNTRIES = [
  // Tier A - Gold (10)
  "US", "CA", "AU", "GB", "NZ", "ZA", "DE", "NL", "AE", "BR",
  // Tier B - Blue (18)
  "IE", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "ES", "FR", "IT", "PT", "SA", "QA", "MX", "IN", "ID", "TH",
  // Tier C - Silver (26)
  "PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "TR", "KW", "OM", "BH", "SG", "MY", "JP", "KR", "CL", "AR", "CO", "PE", "VN", "PH",
  // Tier D - Slate (3)
  "UY", "PA", "CR"
];

// Map codes to display names (Top logic placeholder)
const countryNames: Record<string, string> = {
  "US": "United States",
  "CA": "Canada",
  "AU": "Australia",
  "GB": "United Kingdom",
  "DE": "Germany",
  // Fallbacks handled dynamically below
};

// 1. GENERATE STATIC PARAMS: Build these exact 57 pages at compile time!
export async function generateStaticParams() {
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
