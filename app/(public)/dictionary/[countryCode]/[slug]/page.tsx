import { permanentRedirect } from "next/navigation";

export default async function DictionaryCountryTermRedirect({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>;
}) {
  const { countryCode, slug } = await params;
  permanentRedirect(`/glossary/country/${countryCode.toLowerCase()}/${slug}`);
}
