import { redirect } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════
// /regulations/us/[state] — US state regulation redirect
// P1 FIX: Empty directory. Redirect to /escort-requirements/[state]
// where the actual data lives.
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ state: string }>;
}

export default async function USStateRegulationPage({ params }: PageProps) {
  const { state } = await params;
  redirect(`/escort-requirements/${state.toLowerCase()}`);
}
