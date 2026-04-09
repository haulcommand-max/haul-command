"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LOGO_SRC, ALT_TEXT } from "@/lib/config/brand";
import { MobileNavSheet } from "@/components/layout/MobileNavSheet";
import { AccountButton } from "@/components/auth/AccountButton";

type CommandLink = {
  label: string;
  href: string;
  badge?: string;
  priority?: number;
};

const COMMAND_LINKS: CommandLink[] = [
  { label: "Directory", href: "/directory" },
  { label: "Load Board", href: "/loads" },
  { label: "Regulations", href: "/escort-requirements" },
  { label: "Training", href: "/training", badge: "New" },
  { label: "Leaderboard", href: "/leaderboards" },
];

export function GlobalCommandBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D4A348]/20 bg-black/85 backdrop-blur-md supports-[backdrop-filter]:bg-black/70">
      {/* ── Desktop & Main Mobile Shell ── */}
      <div className="mx-auto flex min-h-14 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-5 lg:min-h-16 lg:px-6 xl:px-8">
        
        {/* Left cluster: Logo + Desktop Links */}
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-xl px-1 py-1 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#D4A348]/50"
          >
            <Image
              src={LOGO_SRC}
              alt={ALT_TEXT}
              width={200}
              height={44}
              priority
              className="object-contain object-left max-h-[36px] sm:max-h-[40px] drop-shadow-md contrast-105 saturate-105"
            />
          </Link>

          {/* Inline desktop command nav */}
          <nav className="hidden min-w-0 items-center gap-4 md:flex lg:gap-5 xl:gap-6" aria-label="Primary">
            {COMMAND_LINKS.map((link) => {
              const isActive = pathname?.startsWith(link.href) && link.href !== "/";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex h-10 items-center rounded-xl px-2 text-[13px] tracking-[0.02em] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A348]/50 relative ${
                    isActive
                      ? "font-semibold text-[#D4A348] transition-colors"
                      : "font-medium text-white/72 hover:text-white transition-colors"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1.5 rounded-md bg-[#D4A348]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#E3B55D]">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute inset-x-2 bottom-1 h-px rounded-full bg-[#D4A348]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right cluster: Sign In + Hamburger */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AccountButton />
          
          <div className="flex md:hidden">
            <MobileNavSheet />
          </div>
        </div>
      </div>

      {/* ── Minimal Horizontal Swipe Rail (Mobile Only) ── */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3 pt-2 md:hidden">
        {COMMAND_LINKS.map((link) => {
          const isActive = pathname?.startsWith(link.href) && link.href !== "/";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm transition ${
                isActive
                  ? "border border-[#D4A348]/50 bg-[#D4A348]/10 text-[#E3B55D] font-semibold"
                  : "border border-white/10 bg-white/[0.03] text-white/80 font-medium hover:border-[#D4A348]/40 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
