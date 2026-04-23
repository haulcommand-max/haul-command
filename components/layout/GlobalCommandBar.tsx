"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LOGO_SRC, ALT_TEXT } from "@/lib/config/brand";
import { HCMobileMenu } from "@/components/landing-system/mobile-menu/HCMobileMenu";
import { AccountButton } from "@/components/auth/AccountButton";

type CommandLink = {
  label: string;
  href: string;
  badge?: string;
};

const COMMAND_LINKS: CommandLink[] = [
  { label: "Directory", href: "/directory" },
  { label: "Route Intel", href: "/tools/route-iq" },
  { label: "Market Data", href: "/corridors" },
  { label: "Tools", href: "/tools" },
  { label: "Pilot Car Files", href: "/escort-requirements" },
  { label: "Haul Command Pro", href: "/pricing" },
];

export function GlobalCommandBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0F14] border-b border-white/[0.06] shadow-lg">
      {/* ── Single unified row — logo left, desktop nav center, actions right ── */}
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-5 lg:h-16 lg:px-8 xl:px-10">

        {/* Left: Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 py-1 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#F1A91B]/50"
        >
          {/* Haul Command logo — gold military badge mark */}
          <Image
            src={LOGO_SRC}
            alt={ALT_TEXT}
            width={180}
            height={87}
            priority
            unoptimized
            className="h-9 w-auto object-contain sm:h-10 rounded-sm"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        </Link>

        {/* Center: Desktop-only nav — strictly hidden on mobile */}
        <nav className="hidden lg:flex min-w-0 items-center gap-1 xl:gap-2" aria-label="Primary navigation">
          {COMMAND_LINKS.map((link) => {
            const isActive = pathname?.startsWith(link.href) && link.href !== "/";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative inline-flex h-10 items-center rounded-lg px-3 text-[13px] tracking-[0.01em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/50 xl:px-4 ${
                  isActive
                    ? "font-bold text-[#F1A91B]"
                    : "font-semibold text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 rounded bg-[#F1A91B]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#F1A91B]">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-3 bottom-1 h-[2px] rounded-full bg-[#F1A91B]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Account actions + mobile hamburger */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/claim"
            className="hidden sm:inline-flex items-center px-4 py-2 bg-[#F1A91B] hover:bg-[#D4951A] text-black text-sm font-bold rounded-lg transition-all shadow-[0_0_12px_rgba(241,169,27,0.35)] hover:shadow-[0_0_20px_rgba(241,169,27,0.5)]"
          >
            Claim Profile
          </Link>
          <AccountButton />
          {/* Mobile menu — ONLY renders on <lg, sole instance across the app */}
          <div className="lg:hidden">
            <HCMobileMenu mode="public" />
          </div>
        </div>
      </div>
      {/* NO horizontal pill rail — that caused the mobile overflow bug */}
    </header>
  );
}
