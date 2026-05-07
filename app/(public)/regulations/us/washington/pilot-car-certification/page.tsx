import type { Metadata } from "next";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import type { EscPublicPage as EscPage } from "@/lib/esc/esc-public-content";

const page: EscPage = {
  slug: "washington-pilot-car-certification",
  eyebrow: "Washington PEVO",
  title: "Washington Pilot Car Certification Requirements",
  description:
    "Washington PEVO certification requirements, reciprocity notes, equipment readiness, verification, and Haul Command marketplace routing for certified pilot car operators.",
  primaryCta: { label: "Verify PEVO credential", href: "/tools/pevo-certification-lookup" },
  secondaryCta: { label: "Check reciprocity", href: "/tools/certification-reciprocity-checker" },
  sections: [
    {
      heading: "Requirement summary",
      body:
        "Washington PEVO is a core pilot car certification signal. Haul Command treats it as a verified credential input, not as a substitute for equipment proof, insurance, reviews, or performance scoring.",
      bullets: [
        "Washington PEVO is tracked with an 8-hour training baseline and 3-year validity cycle where applicable.",
        "WAC 468-38-100 and MUTCD Part 6 are linked as source references in the public requirements table.",
        "Operators should keep expiration, service areas, equipment, and insurance proof current on their HC-ID profile.",
      ],
    },
    {
      heading: "Haul Command advantage",
      body:
        "ESC-style certification content becomes more useful when it is connected to verification, reciprocity, dispatch eligibility, operator scoring, and equipment monetization.",
      bullets: [
        "Brokers can check certification status before routing work.",
        "Operators can claim profiles and repair missing proof.",
        "Reciprocity warnings can prevent illegal or risky dispatch assumptions.",
      ],
    },
  ],
  relatedLinks: [
    { label: "PEVO certification", href: "/training/pevo-certification" },
    { label: "WITPAC", href: "/training/witpac" },
    { label: "Equipment checklist", href: "/resources/pilot-car-equipment-checklist" },
    { label: "Find Washington operators", href: "/directory?country=US&state=WA&category=pilot-car" },
  ],
};

export const metadata: Metadata = {
  title: "Washington Pilot Car Certification Requirements | Haul Command",
  description: page.description,
  alternates: {
    canonical: "https://www.haulcommand.com/regulations/us/washington/pilot-car-certification",
  },
};

export default function WashingtonPilotCarCertificationPage() {
  return <EscPublicPage page={page} />;
}
