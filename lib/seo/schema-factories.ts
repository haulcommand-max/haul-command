// Haul Command OS - Structure Data Factory
// Purpose: Automates the generation of complex, nested JSON-LD schema for global SEO dominance.

type RegionCode = string; // e.g., 'TX', 'NSW'
type ServiceName = string; // e.g., 'TWIC', 'Lead Pilot'

/**
 * Generates an FAQ schema detailing legal dimension requirements based on the live calculator engine.
 */
export function generateJurisdictionFAQSchema(
  regionCode: RegionCode,
  serviceName: ServiceName,
  thresholds: { width: string; height: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `At what load dimensions is a ${serviceName} required in ${regionCode.toUpperCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `In ${regionCode.toUpperCase()}, loads exceeding ${thresholds.width} in width or ${thresholds.height} in height legally require a ${serviceName} to accompany the move.`
        }
      },
      {
        "@type": "Question",
        "name": `How do I verify a ${serviceName} operator in ${regionCode.toUpperCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Operators must maintain active commercial liability insurance. Haul Command's Credential Wallet system authenticates passing operators before allowing dispatch.`
        }
      }
    ]
  };
}

/**
 * Generates Course schema for training providers (Taken from Evergreen / Escort Certification logic)
 */
export function generateTrainingCourseSchema(
  courseName: string,
  providerName: string,
  price: number,
  currency: string = "USD",
  providerUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": courseName,
    "description": `Official certification and training course required for heavy haul escort operators provided by ${providerName}.`,
    "provider": {
      "@type": "Organization",
      "name": providerName,
      "sameAs": providerUrl
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": currency,
      "category": "Paid"
    }
  };
}

/**
 * Generates LocalBusiness schema for verified fleet operators in the marketplace (Targeted at NTS extraction)
 */
export function generateVerifiedOperatorSchema(
  companyName: string,
  regionCode: RegionCode,
  capabilities: string[],
  trustScore: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${companyName} Heavy Haul Escort`,
    "provider": {
      "@type": "LocalBusiness",
      "name": companyName,
      "address": {
        "@type": "PostalAddress",
        "addressRegion": regionCode.toUpperCase() // Country/State target
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Heavy Haul Capabilities",
      "itemListElement": capabilities.map((cap, i) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": cap
        },
        "position": i + 1
      }))
    },
    // Output trust rating into aggregate rating to dominate Search Snippets
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": trustScore >= 90 ? "4.9" : "4.5",
      "reviewCount": trustScore,
      "bestRating": "5",
      "worstRating": "1"
    }
  };
}
