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
  { label: "Load Board", href: "/loads" },
  { label: "Permits", href: "/permits", badge: "Fast" },
  { label: "Forms", href: "/forms" },
  { label: "Regulations", href: "/escort-requirements" },
  { label: "Training", href: "/training", badge: "New" },
  { label: "Leaderboard", href: "/leaderboards" },
];

export function GlobalCommandBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D4A348]/20 bg-black/85 backdrop-blur-md">
      {/* ── Single unified row — logo left, desktop nav center, actions right ── */}
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-5 lg:h-20 lg:px-8 xl:px-10">

        {/* Left: Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-xl py-2 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#D4A348]/50"
        >
          <Image
            src={LOGO_SRC}
            alt={ALT_TEXT}
            width={180}
            height={40}
            priority
            className="h-8 w-auto object-contain drop-shadow-md contrast-105 saturate-105 sm:h-9"
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
                className={`relative inline-flex h-11 items-center rounded-xl px-3 text-[13px] tracking-[0.02em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A348]/50 xl:px-4 ${
                  isActive
                    ? "font-bold text-[#D4A348]"
                    : "font-semibold text-white/70 hover:text-white"
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 rounded bg-[#D4A348]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3B55D]">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-3 bottom-1.5 h-[2px] rounded-full bg-[#D4A348]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Account actions + mobile hamburger (single canonical instance) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
