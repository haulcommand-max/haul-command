import { notFound } from "next/navigation";
import { getGlossaryCountryPayload } from "@/lib/glossary/queries";
import { glossaryCountryMetadata } from "@/lib/glossary/seo";
import { GlossaryCountryPage } from "@/components/glossary/glossary-country-page";
import { isLikelyCountryCode, uppercaseCountryCode } from "@/lib/glossary/utils";
import { createClient } from "@/utils/supabase/server";
import { buildEEATCollectionSchema } from "@/lib/glossary/eeat";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("glo_geo_overlays")
    .select("country_code");

  const countries = [...new Set((data || []).map(d => d.country_code.toLowerCase()))];

  return countries.map((country) => ({
    country,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;

  if (!isLikelyCountryCode(country)) {
    return {
      title: "Glossary page not found | Haul Command",
    };
  }

  const payload = await getGlossaryCountryPayload(uppercaseCountryCode(country));

  if (!payload) {
    return {
      title: "Glossary country not found | Haul Command",
    };
  }

  return glossaryCountryMetadata(payload);
}

export default async function GlossaryCountryRoute({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;

  if (!isLikelyCountryCode(country)) notFound();

  const payload = await getGlossaryCountryPayload(uppercaseCountryCode(country));

  if (!payload) notFound();

  const collectionSchema = buildEEATCollectionSchema({
    name: `${payload.country_code} Heavy Haul Glossary`,
    url: `${SITE_URL}/glossary/${payload.country_code.toLowerCase()}`,
    terms: payload.terms,
  });

  return (
    <main className="p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      <GlossaryCountryPage payload={payload} />
    </main>
  );
}
