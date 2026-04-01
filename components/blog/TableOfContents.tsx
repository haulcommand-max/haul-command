"use client";
import React, { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Scan the article for H2 and H3 elements
    const article = document.querySelector("article");
    if (!article) return;

    const headings = article.querySelectorAll("h2, h3");
    const tocItems: TocItem[] = [];

    headings.forEach((heading, index) => {
      // Generate ID if missing
      if (!heading.id) {
        heading.id = `section-${index}-${heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40) || index}`;
      }
      tocItems.push({
        id: heading.id,
        text: heading.textContent || "",
        level: heading.tagName === "H2" ? 2 : 3,
      });
    });

    setItems(tocItems);
  }, []);

  // Intersection observer for active section tracking
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null; // Don't show TOC for short articles

  return (
    <nav
      className="my-8 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      aria-label="Table of contents"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          In This Article
        </span>
        <span className="text-gray-600 text-xs">
          {collapsed ? "▼" : "▲"}
        </span>
      </button>

      {!collapsed && (
        <ol className="px-4 pb-4 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`block py-1 text-xs transition-colors leading-snug ${
                  item.level === 3 ? "pl-4" : ""
                } ${
                  activeId === item.id
                    ? "text-amber-400 font-semibold"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
