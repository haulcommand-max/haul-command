import { notFound } from "next/navigation";
import { getGlossaryCountryPayload } from "@/lib/glossary/queries";
import { glossaryCountryMetadata } from "@/lib/glossary/seo";
import { GlossaryCountryPage } from "@/components/glossary/glossary-country-page";
import { isLikelyCountryCode, uppercaseCountryCode } from "@/lib/glossary/utils";

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

  return (
    <main className="p-6">
      <GlossaryCountryPage payload={payload} />
    </main>
  );
}
