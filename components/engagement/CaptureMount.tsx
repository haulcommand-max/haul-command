"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { decideCaptureOffer, shouldTrigger, isDismissed, markDismissed, type TriggerSignals, type CaptureOffer } from "@/lib/capture/capture-router";
import type { VisitorIdentity, PageContext, VisitorRole } from "@/lib/capture/identity-ladder";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CaptureMount() {
  const [offer, setOffer] = useState<CaptureOffer | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role } = useRole();
  const [signals, setSignals] = useState<TriggerSignals>({
    timeOnPageSeconds: 0,
    sessionPageviews: 1,
    scrollDepthPct: 0,
    hasClickedResult: false,
    hasUsedSearch: false,
    hasUsedFilter: false,
    hasUsedTool: false,
    isMobile: typeof window !== "undefined" && window.innerWidth < 768,
    isReturnVisitor: false,
    referrerType: "direct"
  });

  useEffect(() => {
    let timer: number;
    let scrollListener: () => void;
    let clickListener: () => void;

    if (typeof window !== "undefined") {
      const storedPageViews = parseInt(sessionStorage.getItem("hc_pageviews") || "0");
      sessionStorage.setItem("hc_pageviews", (storedPageViews + 1).toString());
      setSignals((prev) => ({ ...prev, sessionPageviews: storedPageViews + 1 }));

      timer = window.setInterval(() => {
        setSignals((prev) => ({ ...prev, timeOnPageSeconds: prev.timeOnPageSeconds + 1 }));
      }, 1000);

      scrollListener = () => {
        const scrolled = window.scrollY;
        const max = document.body.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (scrolled / max) * 100 : 0;
        setSignals((prev) => prev.scrollDepthPct < pct ? { ...prev, scrollDepthPct: pct } : prev);
      };
      window.addEventListener("scroll", scrollListener, { passive: true });

      clickListener = () => {
        setSignals((prev) => ({ ...prev, hasClickedResult: true }));
      };
      window.addEventListener("click", clickListener, { passive: true });
    }

    return () => {
      if (timer) clearInterval(timer);
      if (scrollListener) window.removeEventListener("scroll", scrollListener);
      if (clickListener) window.removeEventListener("click", clickListener);
    };
  }, [pathname]);

  useEffect(() => {
    if (offer) return;

    let pageType: PageContext["pageType"] = "homepage";
    if (pathname.includes("/directory")) pageType = "operator_directory";
    if (pathname.includes("/corridors")) pageType = "corridor";
    if (pathname.includes("/regulations")) pageType = "regulation";
    if (pathname.includes("/blog")) pageType = "blog";

    const context: PageContext = { pageType, slug: pathname.split("/").pop() || "" };

    let inferredRole: VisitorRole = "unknown";
    if (role === "escort_operator") inferredRole = "operator";
    if (role === "fleet_owner") inferredRole = "carrier";
    if (role === "broker_dispatcher" || role === "both") inferredRole = "broker";

    const identity: VisitorIdentity = {
      inferredRole,
      alertCategories: [],
      facebookGroupConfirmed: "unknown",
      profileCompletionPct: 0,
      rung: "anonymous",
      sessionId: "",
      userId: null,
      email: null,
      roleConfidence: 1,
      communityJoinedAt: null,
      pushEnabled: false,
      savedStates: [],
      savedCorridors: [],
      savedOperators: [],
      savedSearches: [],
      followedRegulations: [],
      pageviewCount: signals.sessionPageviews,
      firstVisitAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString(),
      totalSessionSeconds: signals.timeOnPageSeconds,
      directoryPageviews: 0,
      toolUsageCount: 0,
      searchCount: 0,
      scrollDepthMax: signals.scrollDepthPct,
      claimState: null,
      stripeCustomerId: null,
      subscriptionTier: "none",
      sponsorActive: false
    };

    if (shouldTrigger(signals, context)) {
      const bestOffer = decideCaptureOffer(identity, context, signals);
      if (bestOffer && !isDismissed(bestOffer.dismissKey, bestOffer.cooldownMinutes)) {
        setOffer(bestOffer);
      }
    }
  }, [signals.timeOnPageSeconds, signals.scrollDepthPct, offer, pathname, role]);

  if (!offer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: offer.variant === "bottom_sheet" ? 100 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed z-[9999] p-4 ${
          offer.variant === "bottom_sheet" 
            ? "bottom-0 left-0 right-0 w-full" 
            : "bottom-4 right-4 max-w-sm"
        }`}
      >
        <div className="bg-[#0B0B0C] border border-hc-gold-500/30 rounded-xl p-5 shadow-2xl relative select-none">
          <button 
            onClick={() => { markDismissed(offer.dismissKey); setOffer(null); }}
            className="absolute top-2 right-2 text-hc-muted hover:text-white"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-4">
            <div className="text-3xl">{offer.icon}</div>
            <div>
              <h4 className="font-bold text-white mb-1">{offer.headline}</h4>
              <p className="text-xs text-hc-muted mb-4">{offer.subtext}</p>
              <div className="flex gap-2">
                <Link 
                  href={offer.ctaUrl}
                  onClick={() => { markDismissed(offer.dismissKey); setOffer(null); }}
                  className="bg-hc-gold-500 text-black px-4 py-2 rounded font-bold text-xs hover:bg-hc-gold-400 transition"
                >
                  {offer.ctaLabel}
                </Link>
                {offer.secondaryCta && (
                  <Link 
                    href={offer.secondaryCta.url}
                    onClick={() => { markDismissed(offer.dismissKey); setOffer(null); }}
                    className="border border-white/10 text-hc-muted px-4 py-2 rounded font-bold text-xs hover:text-white transition"
                  >
                    {offer.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
