import { getGlossaryHubPayload } from "@/lib/glossary/queries";
import { glossaryHubMetadata } from "@/lib/glossary/seo";
import { GlossaryHub } from "@/components/glossary/glossary-hub";
import { AdGridSlot } from "@/components/home/AdGridSlot";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const payload = await getGlossaryHubPayload();
  return glossaryHubMetadata(payload);
}

export default async function GlossaryPage() {
  const payload = await getGlossaryHubPayload();

  return (
    <main className="p-6">
      <GlossaryHub payload={payload} />
      <div className="max-w-4xl mx-auto mt-8">
        <AdGridSlot zone="glossary_sponsor" />
      </div>
    </main>
  );
}