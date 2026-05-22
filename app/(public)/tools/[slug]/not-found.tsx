import Link from "next/link";

// The global app/layout.tsx renders <TopicHeroRouteSlot />, which titlizes
// the URL slug into a "{Slug} Tool" hero with a "Run this tool" CTA. On a
// 404 page that's misleading -- the audit kept reporting "loads a generic
// tool detail page with a Run this tool button, then a 404 at the bottom"
// exactly because of this. data-hc-topic-hero="manual" tells
// TopicHeroRouteSlot to suppress itself.

const RECOVERY_LINKS = [
  { href: "/tools", label: "Browse all tools" },
  { href: "/directory", label: "Find an operator" },
  { href: "/regulations", label: "Check regulations" },
  { href: "/glossary", label: "Glossary" },
];

export default function ToolNotFound() {
  return (
    <div
      data-hc-topic-hero="manual"
      className="min-h-[70vh] flex flex-col justify-center items-center px-6 py-16"
      style={{ background: "#0B0F14", color: "#F5F5F0" }}
    >
      <div className="text-center max-w-xl mx-auto">
        <p
          className="text-8xl font-black tracking-tighter select-none mb-2"
          style={{ color: "rgba(198,146,58,0.2)" }}
        >
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
          Tool Not Available
        </h1>
        <p className="text-base md:text-lg leading-relaxed mb-10" style={{ color: "#94a3b8" }}>
          This tool isn&rsquo;t live yet or has been moved. Here&rsquo;s where to go next.
        </p>

        <Link
          href="/tools"
          className="inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 mb-10"
          style={{ background: "#C6923A", color: "#0B0F14" }}
        >
          Browse all tools
        </Link>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          {RECOVERY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: "rgba(198,146,58,0.06)",
                border: "1px solid rgba(198,146,58,0.2)",
                color: "#F5F5F0",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
