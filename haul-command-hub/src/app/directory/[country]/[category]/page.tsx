import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { supabaseServer } from "@/lib/supabase-server";
import { countryName, categoryLabel, categoryIcon } from "@/lib/directory-helpers";

export const revalidate = 900;
const PAGE_SIZE = 30;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string; category: string }>;
}): Promise<Metadata> {
    const { country, category } = await params;
    const cat = decodeURIComponent(category);
    return {
        title: `${categoryLabel(cat)} in ${countryName(country)}`,
        description: `Browse ${categoryLabel(cat).toLowerCase()} in ${countryName(country)}. Verified listings with contact details, locations, and claim availability.`,
    };
}

export default async function DirectoryCountryCategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ country: string; category: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { country, category } = await params;
    const sp = await searchParams;
    const sb = supabaseServer();

    const cc = country.toLowerCase();
    const cat = decodeURIComponent(category);
    const name = countryName(cc);

    const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
    const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: rows, count } = await sb
        .from("hc_places")
        .select("id, slug, name, surface_category_key, locality, admin1_code, country_code, phone, website, updated_at", {
            count: "exact",
        })
        .eq("status", "published")
        .eq("country_code", cc.toUpperCase())
        .eq("surface_category_key", cat)
        .order("name", { ascending: true })
        .range(from, to);

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <>
            <Navbar />
            <main className="flex-grow">
                {/* Header */}
                <section className="py-16 px-4 border-b border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
                            <Link href="/directory" className="hover:text-accent transition-colors">Directory</Link>
                            <span>/</span>
                            <Link href={`/directory/${cc}`} className="hover:text-accent transition-colors">{name}</Link>
                            <span>/</span>
                            <span className="text-white">{categoryLabel(cat)}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl">{categoryIcon(cat)}</span>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                {categoryLabel(cat)}
                            </h1>
                        </div>
                        <p className="text-gray-400 text-lg">
                            {total > 0
                                ? `${total.toLocaleString()} listing${total !== 1 ? "s" : ""} in ${name}`
                                : `No listings yet for ${categoryLabel(cat).toLowerCase()} in ${name}`}
                        </p>
                    </div>
                </section>

                {/* Listings */}
                <section className="max-w-7xl mx-auto px-4 py-12">
                    {total === 0 ? (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-12 text-center">
                            <div className="text-4xl mb-4">{categoryIcon(cat)}</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Listings Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                We&apos;re expanding {categoryLabel(cat).toLowerCase()} coverage in {name}. Check back soon or{" "}
                                <Link href="/directory" className="text-accent underline">browse other categories</Link>.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(rows ?? []).map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/place/${p.slug}`}
                                        className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 hover:bg-accent/[0.02] transition-all group"
                                    >
                                        <h3 className="text-white font-semibold group-hover:text-accent transition-colors truncate">
                                            {p.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1.5">
                                            {[p.locality, p.admin1_code, p.country_code?.toUpperCase()].filter(Boolean).join(", ")}
                                        </p>
                                        {(p.phone || p.website) && (
                                            <div className="flex gap-3 mt-3 text-xs text-gray-600">
                                                {p.phone && <span>📞 {p.phone}</span>}
                                                {p.website && <span>🌐 Website</span>}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <nav className="flex items-center justify-center gap-4 mt-10">
                                    {page > 1 && (
                                        <Link
                                            href={`/directory/${cc}/${encodeURIComponent(cat)}?page=${page - 1}`}
                                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-all"
                                        >
                                            ← Previous
                                        </Link>
                                    )}
                                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                                    {page < totalPages && (
                                        <Link
                                            href={`/directory/${cc}/${encodeURIComponent(cat)}?page=${page + 1}`}
                                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-all"
                                        >
                                            Next →
                                        </Link>
                                    )}
                                </nav>
                            )}
                        </>
                    )}
                </section>
            </main>
        </>
    );
}
