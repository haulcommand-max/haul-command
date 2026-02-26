import type { Config } from "tailwindcss";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Design System Tokens v4
// Source of truth: /public/brand/design-tokens.json
// Gold: #C6923A | Black: #121212 | Never hardcode hex in components
// ══════════════════════════════════════════════════════════════

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // ── Color Palette ───────────────────────────────────────
            colors: {
                background: "var(--hc-bg)",
                foreground: "var(--hc-text)",
                hc: {
                    // Gold spectrum (from master logo — NEVER CHANGE)
                    gold: {
                        "700": "#6B4A1C", // Deep shadow
                        "600": "#8A6428", // Command Gold — hover/depth
                        "500": "#C6923A", // PRIMARY GOLD — CTAs, authority
                        "400": "#E0B05C", // Light gold — highlights
                        "300": "#F1C27B", // Pale gold — subtle accents
                        "200": "#F8DFB0", // Near-white gold
                    },
                    // ── COMMAND BLACK SURFACES (OSOW-Killer Edition) ──
                    bg: "#0B0B0C", // App shell — deepest black
                    surface: "#111214", // Cards, panels
                    elevated: "#16181B", // Nested modules, inputs
                    high: "#1E2028", // Modals, dropdowns
                    // ── TEXT ON DARK ──
                    text: "#F3F4F6", // Primary — near-white
                    muted: "#9CA3AF", // Secondary labels
                    subtle: "#4B5563", // Ghost text
                    // ── BORDERS ──
                    border: "#23262B",              // Default separator
                    "border-high": "rgba(198,146,58,0.40)", // Active / gold ring
                    "border-bare": "rgba(255,255,255,0.05)", // Minimal neutral
                    // ── SEMANTIC STATUS (vibrant on dark) ──
                    success: "#22C55E", // Available, verified, on-time
                    warning: "#F59E0B", // Surge, at-risk, urgent
                    danger: "#EF4444", // Critical, expired, risk
                    info: "#3B82F6", // Informational
                    // ── APP ROLES ──
                    "escort": "#C6923A", // Escort identity
                    "broker": "#4299E1", // Broker identity
                    "corridor": "#9F7AEA", // Corridor accent
                },
                // Short-form aliases for common use
                gold: "#C6923A",
                "cmd-black": "#121212",
            },

            // ── Typography ──────────────────────────────────────────
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
                mono: ["JetBrains Mono", "Menlo", "monospace"],
                display: ["Space Grotesk", "Inter", "sans-serif"],
            },
            fontSize: {
                // Blue-collar readability: nothing below 14px in UI
                xs: ["13px", { lineHeight: "1.4" }],
                sm: ["14px", { lineHeight: "1.5" }],
                base: ["16px", { lineHeight: "1.6" }],
                lg: ["18px", { lineHeight: "1.5" }],
                xl: ["20px", { lineHeight: "1.4" }],
                "2xl": ["24px", { lineHeight: "1.3" }],
                "3xl": ["30px", { lineHeight: "1.2" }],
                "4xl": ["36px", { lineHeight: "1.1" }],
                "5xl": ["48px", { lineHeight: "1.0" }],
                "6xl": ["60px", { lineHeight: "1.0" }],
                "7xl": ["72px", { lineHeight: "1.0" }],
                "8xl": ["96px", { lineHeight: "1.0" }],
            },

            // ── Spacing (touch-target base: 44px) ───────────────────
            spacing: {
                "touch": "44px",  // Minimum touch target
                "touch-lg": "52px", // Large touch target
                "touch-xl": "60px", // Bottom nav height
                "18": "4.5rem",
                "22": "5.5rem",
            },

            // ── Border Radius ───────────────────────────────────────
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
                "pill": "9999px",
            },

            // ── Box Shadow ──────────────────────────────────────────
            boxShadow: {
                "gold-sm": "0 0 8px rgba(198,146,58,0.25)",
                "gold-md": "0 0 20px rgba(198,146,58,0.20)",
                "gold-lg": "0 0 40px rgba(198,146,58,0.15)",
                "gold-ring": "0 0 0 2px rgba(198,146,58,0.5)",
                "dispatch": "0 4px 24px rgba(198,146,58,0.35), 0 0 0 1px rgba(198,146,58,0.2)",
                "card-hover": "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(198,146,58,0.12)",
                "panel": "0 4px 16px rgba(0,0,0,0.4)",
                "elevated": "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.3)",
            },

            // ── Gradients ───────────────────────────────────────────
            backgroundImage: {
                "gold-gradient": "linear-gradient(135deg, #C6923A 0%, #8A6428 100%)",
                "gold-gradient-h": "linear-gradient(90deg, #C6923A 0%, #8A6428 100%)",
                "gold-shimmer": "linear-gradient(90deg, transparent 0%, rgba(198,146,58,0.08) 50%, transparent 100%)",
                "dark-gradient": "linear-gradient(180deg, #1E1E1E 0%, #121212 100%)",
                "card-gradient": "linear-gradient(180deg, #222 0%, #1A1A1A 100%)",
                "radial-gold-glow": "radial-gradient(ellipse at 50% 0%, rgba(198,146,58,0.15) 0%, transparent 70%)",
                "skeleton-shimmer": "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
            },

            // ── Animation ───────────────────────────────────────────
            transitionDuration: {
                "150": "150ms",
                "200": "200ms",
                "250": "250ms",
            },
            keyframes: {
                "pulse-gold": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(198,146,58,0.4)" },
                    "70%": { boxShadow: "0 0 0 10px rgba(198,146,58,0)" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "slide-up": {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "number-pop": {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.12)" },
                    "100%": { transform: "scale(1)" },
                },
                "glow-ring": {
                    "0%, 100%": { boxShadow: "0 0 5px rgba(198,146,58,0.2), 0 0 20px rgba(198,146,58,0.05)" },
                    "50%": { boxShadow: "0 0 10px rgba(198,146,58,0.4), 0 0 40px rgba(198,146,58,0.10)" },
                },
            },
            animation: {
                "pulse-gold": "pulse-gold 2s infinite",
                "shimmer": "shimmer 1.5s infinite",
                "slide-up": "slide-up 0.2s ease-out",
                "fade-in": "fade-in 0.2s ease-out",
                "number-pop": "number-pop 0.3s ease-out",
                "glow-ring": "glow-ring 3s ease-in-out infinite",
            },
        },
    },
    plugins: [],
};

export default config;
