import { getPageSeoContract, normalizeStructuredData } from "@/lib/seo/page-seo-contract-db";
import { JsonLd } from "@/components/seo/JsonLd";

type PageSeoContractJsonLdProps = {
  path: string;
};

export async function PageSeoContractJsonLd({ path }: PageSeoContractJsonLdProps) {
  const contract = await getPageSeoContract(path);
  const jsonLd = normalizeStructuredData(contract?.structured_data_json ?? null);

  return <JsonLd data={jsonLd} />;
}
