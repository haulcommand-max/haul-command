"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HouseAdSlot } from "@/components/ads/HouseAdSlot";
import type { TopicHeroConfig, TopicHeroCta, TopicHeroLink } from "@/lib/topic-hero/types";
import { getTopicVisualOntology } from "@/lib/topic-hero/ontology";

type HaulCommandTopicHeroProps = {
  config: TopicHeroConfig;
  className?: string;
  renderRelatedNextSteps?: boolean;
  source?: "manual" | "auto";
};

type HeroEventType =
  | "hero_impression"
  | "hero_search_submit"
  | "hero_ask_submit"
  | "hero_no_result"
  | "hero_result_click"
  | "hero_chip_click"
  | "hero_cta_click"
  | "hero_next_step_click"
  | "hero_scroll_depth";

function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  try {
    if (document.cookie.includes("hc_consent=full")) return true;
    const raw = localStorage.getItem("hc_cookie_consent");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

function redactedQuery(query: string) {
  return query
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .trim()
    .slice(0, 160);
}

function trackHeroEvent(config: TopicHeroConfig, eventType: HeroEventType, meta: Record<string, unknown> = {}) {
  if (!hasAnalyticsConsent()) return;

  const body = {
    eventType,
    pageFamily: config.pageFamily,
    pageTopic: config.pageTopic,
    routePattern: config.routePattern,
    heroTier: config.heroTier,
    searchScope: config.searchScope,
    askScope: config.askTitle,
    countryIntent: config.countryScope,
    regionIntent: config.regionScope,
    cityIntent: config.cityScope,
    corridorIntent: config.corridorScope,
    roleIntent: config.roleScope,
    ...meta,
  };

  try {
    const payload = JSON.stringify(body);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/topic-hero/events", new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    // Fall back to fetch.
  }

  fetch("/api/topic-hero/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

function joinClasses(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function ctaClass(style: TopicHeroCta["style"]) {
  if (style === "secondary") return "hc-topic-hero__cta hc-topic-hero__cta--secondary";
  if (style === "ghost") return "hc-topic-hero__cta hc-topic-hero__cta--ghost";
  return "hc-topic-hero__cta hc-topic-hero__cta--primary";
}

function scopeText(config: TopicHeroConfig) {
  return [
    config.countryScope,
    config.regionScope,
    config.cityScope,
    config.corridorScope,
    config.roleScope,
  ]
    .filter(Boolean)
    .join(" / ");
}

function VisualConsole({ config }: { config: TopicHeroConfig }) {
  const ontology = getTopicVisualOntology(config.pageFamily);
  const left = config.rotatingLeftPills?.length ? config.rotatingLeftPills : ontology.visualObjects;
  const right = config.rotatingRightPills?.length ? config.rotatingRightPills : ontology.metadataLanguage;

  return (
    <div
      className={joinClasses(
        "hc-topic-hero__visual",
        `hc-topic-hero__visual--${config.heroVisualPreset}`,
        `hc-topic-hero__motion--${config.animationPreset}`,
      )}
      aria-label={`${config.pageTopic} visual context`}
    >
      <div className="hc-topic-hero__visual-grid" />
      <div className="hc-topic-hero__route-line" />
      <div className="hc-topic-hero__meter">
        <span />
      </div>
      <div className="hc-topic-hero__visual-stack">
        {left.slice(0, 4).map((item, index) => (
          <span key={item} style={{ animationDelay: `${index * 0.45}s` }}>
            {item}
          </span>
        ))}
      </div>
      <div className="hc-topic-hero__visual-stack hc-topic-hero__visual-stack--right">
        {right.slice(0, 4).map((item, index) => (
          <span key={item} style={{ animationDelay: `${index * 0.55}s` }}>
            {item}
          </span>
        ))}
      </div>
      <div className="hc-topic-hero__visual-card">
        <div className="hc-topic-hero__visual-label">{config.heroVisualPreset.replace(/-/g, " ")}</div>
        <div className="hc-topic-hero__visual-title">{config.pageTopic}</div>
        <div className="hc-topic-hero__visual-proof">
          {config.sourceConfidence ?? "developing"} / {config.animationPreset.replace(/-/g, " ")}
        </div>
      </div>
    </div>
  );
}

function SearchModule({ config, mode }: { config: TopicHeroConfig; mode: "search" | "ask" }) {
  const [query, setQuery] = useState("");
  const isAsk = mode === "ask";
  const placeholder = isAsk ? config.askPlaceholder : config.searchPlaceholder;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    trackHeroEvent(config, isAsk ? "hero_ask_submit" : "hero_search_submit", {
      query: redactedQuery(trimmed),
      queryLength: trimmed.length,
      toolIntent: config.pageFamily.includes("tool") ? config.pageTopic : undefined,
      regulationIntent: config.pageFamily.includes("regulation") ? config.pageTopic : undefined,
      glossaryIntent: config.pageFamily.includes("glossary") ? config.pageTopic : undefined,
      providerIntent: config.pageFamily.includes("directory") ? config.pageTopic : undefined,
    });

    const url = new URL(config.searchAction ?? "/search", window.location.origin);
    url.searchParams.set(config.searchParamName ?? "q", trimmed);
    url.searchParams.set("scope", config.searchScope);
    url.searchParams.set("topic", config.pageTopic);
    if (isAsk) url.searchParams.set("ask", "1");
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <form id={isAsk ? "topic-hero-ask" : "topic-hero-search"} className="hc-topic-hero__search" onSubmit={handleSubmit}>
      <label className="hc-topic-hero__search-label" htmlFor={isAsk ? "topic-hero-ask-input" : "topic-hero-search-input"}>
        {isAsk ? config.askTitle : "Search Haul Command"}
      </label>
      <div className="hc-topic-hero__search-row">
        <input
          id={isAsk ? "topic-hero-ask-input" : "topic-hero-search-input"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          type="search"
          autoComplete="off"
        />
        <button type="submit">{isAsk ? "Ask" : "Search"}</button>
      </div>
      {isAsk && <p className="hc-topic-hero__ask-prompt">{config.askPrompt}</p>}
    </form>
  );
}

function LinkPill({
  config,
  item,
  eventType,
}: {
  config: TopicHeroConfig;
  item: TopicHeroLink;
  eventType: HeroEventType;
}) {
  return (
    <Link
      href={item.href}
      className="hc-topic-hero__pill"
      onClick={() =>
        trackHeroEvent(config, eventType, {
          label: item.label,
          href: item.href,
          intent: item.intent,
          claimIntent: item.intent === "claim_intent",
          loadPostIntent: item.intent === "load_post_intent",
          sponsorIntent: item.intent === "sponsor_intent",
          proIntent: item.intent === "pro_intent",
        })
      }
    >
      {item.label}
    </Link>
  );
}

function NextStepCards({ config }: { config: TopicHeroConfig }) {
  return (
    <div className="hc-topic-hero__next-steps" aria-label={`${config.pageTopic} related next steps`}>
      {config.relatedNextSteps.slice(0, 6).map((step) => (
        <Link
          key={`${step.href}-${step.label}`}
          href={step.href}
          className="hc-topic-hero__next-card"
          onClick={() =>
            trackHeroEvent(config, "hero_next_step_click", {
              label: step.label,
              href: step.href,
              intent: step.intent,
            })
          }
        >
          <span>{step.label}</span>
          {step.description && <small>{step.description}</small>}
        </Link>
      ))}
    </div>
  );
}

export function HaulCommandTopicHero({
  config,
  className = "",
  renderRelatedNextSteps = true,
  source = "manual",
}: HaulCommandTopicHeroProps) {
  const ctas = useMemo(
    () => [config.primaryCTA, config.secondaryCTA, config.tertiaryCTA].filter(Boolean) as TopicHeroCta[],
    [config.primaryCTA, config.secondaryCTA, config.tertiaryCTA],
  );
  const sectionRef = useRef<HTMLElement | null>(null);
  const sentDepths = useRef(new Set<number>());
  const scopedText = scopeText(config);
  const compact = config.heroTier === "tier3" || config.heroTier === "tier4";

  useEffect(() => {
    trackHeroEvent(config, "hero_impression", {
      metadataStatus: config.schemaType.join(","),
      hasHouseAd: Boolean(config.houseAdSlot),
      hasSearch: config.searchMode !== "action-only",
    });
  }, [config]);

  useEffect(() => {
    function onScroll() {
      const element = sectionRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const total = Math.max(rect.height, 1);
      const viewed = Math.min(total, Math.max(0, window.innerHeight - rect.top));
      const depth = Math.round((viewed / total) * 100);
      for (const threshold of [50, 100]) {
        if (depth >= threshold && !sentDepths.current.has(threshold)) {
          sentDepths.current.add(threshold);
          trackHeroEvent(config, "hero_scroll_depth", { depth: threshold });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [config]);

  return (
    <section
      ref={sectionRef}
      className={joinClasses("hc-topic-hero", `hc-topic-hero--${config.heroTier}`, className)}
      data-page-family={config.pageFamily}
      data-page-topic={config.pageTopic}
      data-hero-tier={config.heroTier}
      data-hc-topic-hero={source}
    >
      <img
        className="hc-topic-hero__bg"
        src={config.image.src ?? "/backgrounds/master-background.png"}
        alt=""
        width={config.image.width}
        height={config.image.height}
        loading={config.image.preload ? "eager" : "lazy"}
        fetchPriority={config.image.preload ? "high" : "auto"}
      />
      <div className="hc-topic-hero__overlay" />
      <div className="hc-topic-hero__shell">
        <div className="hc-topic-hero__main">
          <div className="hc-topic-hero__copy">
            {config.eyebrow && <p className="hc-topic-hero__eyebrow">{config.eyebrow}</p>}
            <h1>{config.h1}</h1>
            <p className="hc-topic-hero__subheadline">{config.subheadline}</p>
            {config.microcopy && <p className="hc-topic-hero__microcopy">{config.microcopy}</p>}
            {scopedText && <p className="hc-topic-hero__scope">{scopedText}</p>}

            <div className="hc-topic-hero__badges" aria-label={`${config.pageTopic} proof of depth`}>
              {config.trustBadges.map((badge) => (
                <span key={`${badge.label}-${badge.value ?? ""}`} className={`hc-topic-hero__badge hc-topic-hero__badge--${badge.tone ?? "gold"}`}>
                  {badge.value && <strong>{badge.value}</strong>}
                  {badge.label}
                </span>
              ))}
            </div>

            {config.statCards.length > 0 && (
              <div className="hc-topic-hero__stats" aria-label={`${config.pageTopic} depth signals`}>
                {config.statCards.slice(0, compact ? 3 : 4).map((stat) => (
                  <div key={stat.label} className="hc-topic-hero__stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {config.searchMode !== "action-only" && <SearchModule config={config} mode="search" />}

            <div className="hc-topic-hero__chips" aria-label={`${config.pageTopic} quick links`}>
              {config.quickChips.slice(0, compact ? 5 : 8).map((chip) => (
                <LinkPill key={`${chip.href}-${chip.label}`} config={config} item={chip} eventType="hero_chip_click" />
              ))}
            </div>

            <div className="hc-topic-hero__ctas">
              {ctas.map((cta) => (
                <Link
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className={ctaClass(cta.style)}
                  onClick={() =>
                    trackHeroEvent(config, "hero_cta_click", {
                      label: cta.label,
                      href: cta.href,
                      intent: cta.intent,
                      claimIntent: cta.intent === "claim_intent",
                      loadPostIntent: cta.intent === "load_post_intent",
                      sponsorIntent: cta.intent === "sponsor_intent",
                      proIntent: cta.intent === "pro_intent",
                    })
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </div>

          {!compact && (
            <aside className="hc-topic-hero__side">
              <VisualConsole config={config} />
              {config.houseAdSlot && (
                <HouseAdSlot
                  surface={config.houseAdSlot.surface}
                  placementId={config.houseAdSlot.placementId}
                  intent={config.houseAdSlot.intent}
                  country={config.countryScope}
                  region={config.regionScope}
                  city={config.cityScope}
                  corridor={config.corridorScope}
                  role={config.roleScope}
                  topic={config.pageTopic}
                  pageType={config.pageFamily}
                  variant={config.houseAdSlot.variant ?? "compact"}
                />
              )}
            </aside>
          )}
        </div>

        <div className="hc-topic-hero__lower">
          <SearchModule config={config} mode="ask" />
          <div className="hc-topic-hero__internal-links" aria-label={`${config.pageTopic} internal links`}>
            {config.internalLinks.slice(0, 6).map((link) => (
              <LinkPill key={`${link.href}-${link.label}`} config={config} item={link} eventType="hero_chip_click" />
            ))}
          </div>
        </div>

        {renderRelatedNextSteps && <NextStepCards config={config} />}
      </div>

      <style>{`
        .hc-topic-hero {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          color: #f8f4ea;
          background: #080a0f;
          border-bottom: 1px solid rgba(198, 146, 58, 0.2);
        }

        .hc-topic-hero--tier1 { min-height: min(880px, calc(100vh - 24px)); }
        .hc-topic-hero--tier2 { min-height: 640px; }
        .hc-topic-hero--tier3,
        .hc-topic-hero--tier4 { min-height: 440px; }
        .hc-topic-hero--route-slot.hc-topic-hero--tier4 { min-height: 320px; }

        .hc-topic-hero__bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: -3;
          filter: saturate(0.82) brightness(0.72);
        }

        .hc-topic-hero__overlay {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            radial-gradient(circle at 72% 28%, rgba(198, 146, 58, 0.23), transparent 32%),
            linear-gradient(90deg, rgba(5, 7, 11, 0.98) 0%, rgba(8, 10, 15, 0.9) 52%, rgba(8, 10, 15, 0.66) 100%),
            linear-gradient(180deg, rgba(5, 7, 11, 0.52) 0%, rgba(5, 7, 11, 0.96) 100%);
        }

        .hc-topic-hero__overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.7), transparent 82%);
        }

        .hc-topic-hero__shell {
          position: relative;
          z-index: 1;
          width: min(1240px, calc(100% - 32px));
          margin: 0 auto;
          padding: clamp(88px, 12vh, 136px) 0 42px;
        }

        .hc-topic-hero--route-slot.hc-topic-hero--tier4 .hc-topic-hero__shell {
          padding: 72px 0 28px;
        }

        .hc-topic-hero__main {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.72fr);
          gap: clamp(24px, 4vw, 54px);
          align-items: center;
        }

        .hc-topic-hero--tier3 .hc-topic-hero__main,
        .hc-topic-hero--tier4 .hc-topic-hero__main {
          grid-template-columns: 1fr;
        }

        .hc-topic-hero__copy {
          border: 1px solid rgba(198, 146, 58, 0.2);
          background: linear-gradient(145deg, rgba(8, 10, 14, 0.82), rgba(8, 10, 14, 0.58));
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(18px);
          border-radius: 18px;
          padding: clamp(22px, 4vw, 42px);
        }

        .hc-topic-hero__eyebrow {
          margin: 0 0 16px;
          color: #d9aa53;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.4;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .hc-topic-hero h1 {
          margin: 0;
          max-width: 860px;
          color: #fff9ed;
          font-size: clamp(34px, 5.6vw, 72px);
          font-weight: 950;
          letter-spacing: 0;
          line-height: 0.98;
        }

        .hc-topic-hero--tier3 h1,
        .hc-topic-hero--tier4 h1 {
          font-size: clamp(28px, 4vw, 44px);
        }

        .hc-topic-hero__subheadline,
        .hc-topic-hero__microcopy,
        .hc-topic-hero__scope {
          max-width: 760px;
          color: #dcc7a0;
          font-size: clamp(15px, 1.7vw, 19px);
          line-height: 1.65;
        }

        .hc-topic-hero__subheadline { margin: 18px 0 0; }
        .hc-topic-hero__microcopy { margin: 12px 0 0; color: #f1dcae; font-weight: 750; }
        .hc-topic-hero__scope { margin: 10px 0 0; color: #96a0af; font-size: 13px; }

        .hc-topic-hero__badges,
        .hc-topic-hero__chips,
        .hc-topic-hero__ctas,
        .hc-topic-hero__internal-links {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .hc-topic-hero__badges { margin-top: 22px; }
        .hc-topic-hero__chips { margin-top: 18px; }
        .hc-topic-hero__ctas { margin-top: 22px; }

        .hc-topic-hero__badge,
        .hc-topic-hero__pill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(198, 146, 58, 0.22);
          background: rgba(0, 0, 0, 0.38);
          color: #fff4da;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.2;
          text-decoration: none;
          padding: 7px 12px;
        }

        .hc-topic-hero__badge strong {
          margin-right: 6px;
          color: #e6ba69;
        }

        .hc-topic-hero__badge--green { border-color: rgba(52, 211, 153, 0.35); color: #d9fff0; }
        .hc-topic-hero__badge--blue { border-color: rgba(96, 165, 250, 0.36); color: #deebff; }
        .hc-topic-hero__badge--slate { border-color: rgba(148, 163, 184, 0.28); color: #d6dce5; }
        .hc-topic-hero__badge--red { border-color: rgba(248, 113, 113, 0.34); color: #ffe1e1; }

        .hc-topic-hero__pill:hover {
          border-color: rgba(230, 186, 105, 0.7);
          background: rgba(198, 146, 58, 0.12);
        }

        .hc-topic-hero__stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .hc-topic-hero__stat {
          min-height: 76px;
          border-radius: 12px;
          border: 1px solid rgba(198, 146, 58, 0.18);
          background: rgba(0, 0, 0, 0.36);
          padding: 12px;
        }

        .hc-topic-hero__stat strong {
          display: block;
          color: #f4c978;
          font-size: 20px;
          font-weight: 950;
        }

        .hc-topic-hero__stat span {
          display: block;
          margin-top: 4px;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .hc-topic-hero__search {
          margin-top: 20px;
          border: 1px solid rgba(198, 146, 58, 0.18);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.34);
          padding: 14px;
        }

        .hc-topic-hero__search-label {
          display: block;
          margin-bottom: 8px;
          color: #e6ba69;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .hc-topic-hero__search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }

        .hc-topic-hero__search input {
          width: 100%;
          min-height: 48px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.07);
          color: #fffaf0;
          padding: 0 14px;
          font-size: 15px;
          font-weight: 650;
          outline: none;
        }

        .hc-topic-hero__search input::placeholder { color: rgba(230, 218, 194, 0.52); }
        .hc-topic-hero__search input:focus { border-color: rgba(230, 186, 105, 0.62); box-shadow: 0 0 0 3px rgba(198, 146, 58, 0.13); }

        .hc-topic-hero__search button {
          min-height: 48px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #d9a84f, #f3ca78);
          color: #07080b;
          font-size: 13px;
          font-weight: 950;
          padding: 0 18px;
          cursor: pointer;
        }

        .hc-topic-hero__ask-prompt {
          margin: 10px 0 0;
          color: #a8b0bd;
          font-size: 13px;
          line-height: 1.55;
        }

        .hc-topic-hero__cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border-radius: 11px;
          padding: 0 18px;
          font-size: 13px;
          font-weight: 950;
          text-decoration: none;
        }

        .hc-topic-hero__cta--primary {
          color: #07080b;
          background: linear-gradient(135deg, #d9a84f, #f3ca78);
          box-shadow: 0 18px 40px rgba(198, 146, 58, 0.23);
        }

        .hc-topic-hero__cta--secondary {
          color: #fff4dc;
          border: 1px solid rgba(198, 146, 58, 0.32);
          background: rgba(198, 146, 58, 0.1);
        }

        .hc-topic-hero__cta--ghost {
          color: #d8c6a3;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
        }

        .hc-topic-hero__side {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hc-topic-hero__visual {
          position: relative;
          min-height: 360px;
          overflow: hidden;
          border: 1px solid rgba(198, 146, 58, 0.24);
          border-radius: 18px;
          background:
            radial-gradient(circle at 30% 28%, rgba(198, 146, 58, 0.18), transparent 28%),
            radial-gradient(circle at 72% 70%, rgba(52, 211, 153, 0.1), transparent 30%),
            linear-gradient(145deg, rgba(5, 7, 11, 0.86), rgba(13, 15, 21, 0.62));
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px);
        }

        .hc-topic-hero__visual-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: radial-gradient(circle at center, black, transparent 76%);
        }

        .hc-topic-hero__route-line {
          position: absolute;
          left: 12%;
          right: 12%;
          top: 52%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #e6ba69, #34d399, transparent);
          transform-origin: left;
          opacity: 0.82;
        }

        .hc-topic-hero__meter {
          position: absolute;
          right: 26px;
          top: 26px;
          width: 84px;
          height: 84px;
          border-radius: 999px;
          border: 1px solid rgba(230, 186, 105, 0.32);
          background: conic-gradient(from 180deg, rgba(230, 186, 105, 0.8), rgba(52, 211, 153, 0.56), rgba(255,255,255,0.06));
          padding: 8px;
        }

        .hc-topic-hero__meter span {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: rgba(7, 8, 11, 0.92);
        }

        .hc-topic-hero__visual-stack {
          position: absolute;
          left: 22px;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: min(220px, 44%);
        }

        .hc-topic-hero__visual-stack--right {
          left: auto;
          right: 22px;
          top: auto;
          bottom: 24px;
          align-items: flex-end;
        }

        .hc-topic-hero__visual-stack span {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          color: #f4ead4;
          font-size: 11px;
          font-weight: 850;
          line-height: 1.2;
          padding: 8px 10px;
        }

        .hc-topic-hero__visual-card {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(260px, 72%);
          transform: translate(-50%, -50%);
          border: 1px solid rgba(230, 186, 105, 0.28);
          border-radius: 16px;
          background: rgba(5, 7, 11, 0.72);
          padding: 18px;
          text-align: center;
          box-shadow: 0 22px 62px rgba(0, 0, 0, 0.42);
        }

        .hc-topic-hero__visual-label {
          color: #d9aa53;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .hc-topic-hero__visual-title {
          margin-top: 8px;
          color: #fff8ea;
          font-size: 20px;
          font-weight: 950;
          line-height: 1.1;
        }

        .hc-topic-hero__visual-proof {
          margin-top: 10px;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .hc-topic-hero__lower {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(240px, 0.42fr);
          gap: 16px;
          align-items: stretch;
          margin-top: 18px;
          border: 1px solid rgba(198, 146, 58, 0.18);
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.42);
          padding: 16px;
          backdrop-filter: blur(18px);
        }

        .hc-topic-hero__lower .hc-topic-hero__search {
          margin-top: 0;
          background: rgba(255, 255, 255, 0.035);
        }

        .hc-topic-hero__internal-links {
          align-content: start;
          align-items: flex-start;
          padding-top: 2px;
        }

        .hc-topic-hero__next-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .hc-topic-hero__next-card {
          display: block;
          min-height: 88px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.055);
          color: #fff4da;
          padding: 14px;
          text-decoration: none;
        }

        .hc-topic-hero__next-card:hover {
          border-color: rgba(230, 186, 105, 0.5);
          background: rgba(198, 146, 58, 0.1);
        }

        .hc-topic-hero__next-card span {
          display: block;
          font-size: 14px;
          font-weight: 950;
        }

        .hc-topic-hero__next-card small {
          display: block;
          margin-top: 6px;
          color: #aeb5c0;
          font-size: 12px;
          line-height: 1.45;
        }

        .hc-topic-hero__motion--route-draw .hc-topic-hero__route-line,
        .hc-topic-hero__motion--threshold-sweep .hc-topic-hero__route-line {
          animation: hcTopicRouteDraw 4.8s ease-in-out infinite;
        }

        .hc-topic-hero__motion--digits-tick .hc-topic-hero__meter,
        .hc-topic-hero__motion--trust-meter .hc-topic-hero__meter,
        .hc-topic-hero__motion--badge-progress .hc-topic-hero__meter {
          animation: hcTopicMeter 5s ease-in-out infinite;
        }

        .hc-topic-hero__motion--pin-pulse .hc-topic-hero__visual-card,
        .hc-topic-hero__motion--heat-breathe .hc-topic-hero__visual-card,
        .hc-topic-hero__motion--term-connect .hc-topic-hero__visual-card,
        .hc-topic-hero__motion--load-ticker .hc-topic-hero__visual-card {
          animation: hcTopicPulse 4.4s ease-in-out infinite;
        }

        .hc-topic-hero__visual-stack span {
          animation: hcTopicChip 7s ease-in-out infinite;
        }

        @keyframes hcTopicRouteDraw {
          0%, 100% { transform: scaleX(0.38); opacity: 0.45; }
          50% { transform: scaleX(1); opacity: 0.9; }
        }

        @keyframes hcTopicMeter {
          0%, 100% { transform: rotate(-8deg); filter: brightness(0.92); }
          50% { transform: rotate(8deg); filter: brightness(1.16); }
        }

        @keyframes hcTopicPulse {
          0%, 100% { box-shadow: 0 22px 62px rgba(0,0,0,0.42), 0 0 0 rgba(198,146,58,0); }
          50% { box-shadow: 0 22px 62px rgba(0,0,0,0.42), 0 0 38px rgba(198,146,58,0.22); }
        }

        @keyframes hcTopicChip {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-4px); opacity: 1; }
        }

        @media (max-width: 980px) {
          .hc-topic-hero__main,
          .hc-topic-hero__lower {
            grid-template-columns: 1fr;
          }

          .hc-topic-hero__side {
            order: -1;
          }

          .hc-topic-hero__visual {
            min-height: 280px;
          }

          .hc-topic-hero__stats,
          .hc-topic-hero__next-steps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 620px) {
          .hc-topic-hero__shell {
            width: min(100% - 20px, 1240px);
            padding-top: 74px;
          }

          .hc-topic-hero__copy {
            padding: 18px;
            border-radius: 14px;
          }

          .hc-topic-hero__search-row {
            grid-template-columns: 1fr;
          }

          .hc-topic-hero__search button,
          .hc-topic-hero__search input {
            width: 100%;
          }

          .hc-topic-hero__stats,
          .hc-topic-hero__next-steps {
            grid-template-columns: 1fr;
          }

          .hc-topic-hero__visual-stack--right {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hc-topic-hero *,
          .hc-topic-hero *::before,
          .hc-topic-hero *::after {
            animation: none !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </section>
  );
}
