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

const MOBILE_COMMAND_LINKS: CommandLink[] = [
  { label: "Directory", href: "/directory" },
  { label: "Post Load", href: "/loads/post" },
  { label: "Tools", href: "/tools" },
  { label: "Claim", href: "/claim" },
];

export function GlobalCommandBar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b shadow-[0_10px_30px_rgba(0,0,0,0.42)]"
      style={{
        backgroundColor: "rgba(5, 5, 5, 0.58)",
        borderColor: "rgba(241, 169, 27, 0.24)",
        backdropFilter: "blur(16px) saturate(118%)",
        WebkitBackdropFilter: "blur(16px) saturate(118%)",
      }}
    >
      {/* ── Single unified row — logo left, desktop nav center, actions right ── */}
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-5 lg:h-[72px] lg:px-8 xl:px-10">

        {/* Left: Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-xl py-2 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#F1A91B]/50"
        >
          <Image
            src={LOGO_SRC}
            alt={ALT_TEXT}
            width={240}
            height={60}
            priority
            className="h-10 w-auto max-w-[132px] object-contain sm:h-11 sm:max-w-[164px] lg:h-12 lg:max-w-[190px] xl:max-w-[220px]"
          />
        </Link>

        {/* Center: Desktop-only nav — strictly hidden on mobile */}
        <nav className="hidden min-w-0 items-center gap-1.5 lg:flex xl:gap-2" aria-label="Primary navigation">
          {COMMAND_LINKS.map((link) => {
            const isActive = pathname?.startsWith(link.href) && link.href !== "/";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative inline-flex h-10 items-center rounded-lg border px-3 text-[13px] font-black tracking-[0.01em] shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/70 xl:px-4 ${
                  isActive
                    ? "border-[#F1A91B]/55 bg-[#F1A91B]/18 !text-[#F1A91B]"
                    : "border-white/12 bg-white/[0.055] !text-[#F5F7FB] hover:border-[#F1A91B]/45 hover:bg-[#F1A91B]/12 hover:!text-[#F1A91B]"
                }`}
                style={{
                  color: isActive ? "#F1A91B" : "#F5F7FB",
                  backgroundColor: isActive ? "rgba(241,169,27,0.18)" : "rgba(255,255,255,0.075)",
                  borderColor: isActive ? "rgba(241,169,27,0.62)" : "rgba(255,255,255,0.2)",
                  textShadow: "0 1px 8px rgba(0,0,0,0.95)",
                }}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 rounded bg-[#F1A91B] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-black">
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
            className="hidden sm:inline-flex items-center rounded-lg bg-[#F1A91B] px-4 py-2 text-sm font-black text-black shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition-colors hover:bg-[#D4951A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/70"
          >
            Claim Profile
          </Link>
          <div className="hidden sm:block">
            <AccountButton />
          </div>
          {/* Mobile menu — ONLY renders on <lg, sole instance across the app */}
          <div className="lg:hidden">
            <HCMobileMenu mode="public" />
          </div>
        </div>
      </div>
      {/* NO horizontal pill rail — that caused the mobile overflow bug */}
      <nav
        className="mx-auto grid w-full max-w-screen-sm grid-cols-4 gap-1.5 px-3 pb-2 lg:hidden"
        aria-label="Quick navigation"
      >
        {MOBILE_COMMAND_LINKS.map((link) => {
          const isActive = pathname?.startsWith(link.href) && link.href !== "/";
          const isPrimary = link.href === "/loads/post" || link.href === "/claim";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex h-9 min-w-0 items-center justify-center rounded-lg border px-2 text-center text-[11px] font-black tracking-[0.01em] shadow-[0_8px_18px_rgba(0,0,0,0.22)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/70 ${
                isPrimary
                  ? "border-[#F1A91B]/65 bg-[#F1A91B] text-black hover:bg-[#D4951A]"
                  : isActive
                    ? "border-[#F1A91B]/55 bg-[#F1A91B]/18 text-[#F1A91B]"
                    : "border-white/12 bg-white/[0.055] text-[#F5F7FB] hover:border-[#F1A91B]/45 hover:bg-[#F1A91B]/12 hover:text-[#F1A91B]"
              }`}
            >
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
