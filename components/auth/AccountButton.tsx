"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AccountButton() {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as any);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session as any);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="inline-flex h-11 w-24 animate-pulse items-center justify-center rounded-2xl border border-[#D4A348]/20 bg-black/50 px-4 sm:px-5" />
    );
  }

  if (session) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#D4A348]/60 bg-black/70 px-4 sm:px-5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(212,163,72,0.05),0_6px_18px_rgba(0,0,0,0.35)] transition duration-150 hover:border-[#D4A348]/90 hover:bg-[#D4A348]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A348]/50"
      >
        Account
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#D4A348]/60 bg-black/70 px-4 sm:px-5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(212,163,72,0.05),0_6px_18px_rgba(0,0,0,0.35)] transition duration-150 hover:border-[#D4A348]/90 hover:bg-[#D4A348]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A348]/50"
    >
      Sign In
    </Link>
  );
}
