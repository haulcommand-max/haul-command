"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { HaulCommandTopicHero } from "@/components/topic-hero/HaulCommandTopicHero";
import { buildTopicHeroConfigForRoute } from "@/lib/topic-hero/configs";

const MANUAL_TOPIC_HERO_ROUTES = new Set([
  "/",
  "/tools",
  "/directory",
  "/glossary",
  "/regulations",
  "/training",
]);

function shouldSuppressRoute(pathname: string) {
  if (!pathname || pathname.startsWith("/api") || pathname.startsWith("/_next")) return true;
  return MANUAL_TOPIC_HERO_ROUTES.has(pathname);
}

export function TopicHeroRouteSlot() {
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);

  const config = useMemo(() => {
    if (!pathname || shouldSuppressRoute(pathname)) return null;
    return buildTopicHeroConfigForRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!pathname || shouldSuppressRoute(pathname)) {
      setCanRender(false);
      return;
    }

    const hasManualHero = Boolean(document.querySelector('[data-hc-topic-hero="manual"]'));
    setCanRender(!hasManualHero);
  }, [pathname]);

  if (!config || !canRender) return null;

  return (
    <HaulCommandTopicHero
      config={config}
      className="hc-topic-hero--route-slot"
      renderRelatedNextSteps={config.heroTier !== "tier4"}
      source="auto"
    />
  );
}
