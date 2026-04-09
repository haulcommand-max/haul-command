import { getGlossaryHubPayload } from "@/lib/glossary/queries";
import { glossaryHubMetadata } from "@/lib/glossary/seo";
import { GlossaryHub } from "@/components/glossary/glossary-hub";

export async function generateMetadata() {
  const payload = await getGlossaryHubPayload();
  return glossaryHubMetadata(payload);
}

export default async function GlossaryPage() {
  const payload = await getGlossaryHubPayload();

  return (
    <main className="p-6">
      <GlossaryHub payload={payload} />
    </main>
  );
}
