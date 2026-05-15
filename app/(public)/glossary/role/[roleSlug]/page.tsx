import Link from "next/link";
import type { Metadata } from "next";

function labelFor(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roleSlug: string }>;
}): Promise<Metadata> {
  const { roleSlug } = await params;
  const role = labelFor(roleSlug);
  return {
    title: `${role} Terminology | Haul Command Glossary`,
    description: `Glossary terms, tools, directory paths, and training links for ${role} heavy-haul work.`,
    alternates: { canonical: `https://www.haulcommand.com/glossary/role/${roleSlug}` },
    robots: { index: false, follow: true },
  };
}

export default async function GlossaryRolePage({
  params,
}: {
  params: Promise<{ roleSlug: string }>;
}) {
  const { roleSlug } = await params;
  const role = labelFor(roleSlug);
  const directoryHref = `/directory?role=${roleSlug}`;

  return (
    <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-gray-100">
      <section className="mx-auto max-w-4xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Role Terminology</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{role} Glossary Terms</h1>
        <p className="mt-5 text-lg leading-8 text-gray-300">
          This role glossary hub is prepared for database-backed term clusters. It stays noindex until enough real role
          terms, profile connections, source confidence, and internal links exist for a useful indexable page.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/glossary" className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-black hover:bg-amber-300">
            Browse Glossary
          </Link>
          <Link href={directoryHref} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-white/35">
            Find Related Providers
          </Link>
          <Link href={`/roles/${roleSlug}`} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-white/35">
            View Role Page
          </Link>
        </div>
      </section>
    </main>
  );
}
