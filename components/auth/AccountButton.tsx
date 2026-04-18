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
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C6923A] px-5 text-sm font-bold text-[#07090D] shadow-lg transition duration-150 hover:bg-[#D4A348] hover:shadow-[#C6923A]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6923A]/50"
      >
        Account
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C6923A] px-5 text-sm font-bold text-[#07090D] shadow-lg transition duration-150 hover:bg-[#D4A348] hover:shadow-[#C6923A]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6923A]/50"
    >
      Sign In
    </Link>
  );
}
