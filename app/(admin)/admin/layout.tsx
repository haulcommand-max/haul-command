import Link from "next/link";
import type { ReactNode } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function requireAdminPage() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    redirect("/login?next=%2Fadmin");
  }

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "system_admin") {
    redirect("/next-moves?error=unauthorized_hq");
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();

  return (
    <div className="flex h-screen bg-[#070707] text-[#e5e5e5]">
      <aside className="flex w-64 flex-col border-r border-[#1a1a1a] bg-[#0c0c0c]">
        <div className="border-b border-[#1a1a1a] p-6">
          <h1 className="text-xl font-black tracking-tighter text-[#ffb400]">
            HAUL COMMAND{" "}
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#444]">
              Control Tower
            </span>
          </h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <AdminNavLink href="/admin" label="Dashboard" icon="DB" />
          <AdminNavLink href="/admin/moderation" label="Moderation Inbox" icon="MI" />
          <AdminNavLink href="/admin/directory" label="Directory" icon="DR" />
          <AdminNavLink href="/admin/loads" label="Load Board" icon="LB" />
          <AdminNavLink href="/admin/leaderboard" label="Leaderboard" icon="LR" />
          <AdminNavLink href="/admin/corridors" label="Corridors" icon="CO" />
          <AdminNavLink href="/admin/competitors" label="Competitor Intel" icon="CI" />
          <AdminNavLink href="/admin/heat" label="Heat Engine" icon="HE" />
          <AdminNavLink href="/admin/billing" label="Sponsors & Billing" icon="SB" />
          <AdminNavLink href="/admin/ads" label="AdGrid Revenue" icon="AG" />
          <div className="my-4 border-t border-[#1a1a1a] opacity-20" />
          <AdminNavLink href="/admin/settings" label="Settings" icon="ST" />
          <AdminNavLink href="/admin/audit" label="Audit Log" icon="AL" />
          <div className="my-4 border-t border-[#1a1a1a] opacity-20" />
          <AdminNavLink href="/tools/compliance-copilot" label="Compliance Copilot" icon="CC" />
          <AdminNavLink href="/api/outreach/operators" label="Operator Outreach" icon="OO" />
        </nav>

        <div className="border-t border-[#1a1a1a] p-4">
          <div className="flex items-center gap-2 text-xs text-[#666]">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>System Active</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      aria-label={label}
      href={href}
      className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-[#1a1a1a] hover:text-white"
    >
      <span className="w-5 text-center text-[10px] font-black uppercase text-[#666] group-hover:text-[#ffb400]">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
