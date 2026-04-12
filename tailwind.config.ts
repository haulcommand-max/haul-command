import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
        // Explicit paths for route groups — Windows glob can miss parenthesized dirs
        "./app/(landing)/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/(public)/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/(app)/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/(auth)/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/(onboarding)/**/*.{js,ts,jsx,tsx,mdx}",
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
                "radial-glass": "radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.08) 0%, transparent 70%)",
                "industrial-noise": "url('/bg/noise-grid.png')", // Requires public/bg/noise-grid.png
                "glassmorphism": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
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
                "sweep": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            animation: {
                "pulse-gold": "pulse-gold 2s infinite",
                "shimmer": "shimmer 1.5s infinite",
                "slide-up": "slide-up 0.2s ease-out",
                "fade-in": "fade-in 0.2s ease-out",
                "number-pop": "number-pop 0.3s ease-out",
                "glow-ring": "glow-ring 3s ease-in-out infinite",
                "sweep": "sweep 2s linear infinite",
            },
        },
    },
    plugins: [
        // ── DOUBLE PLATINUM ENTERPRISE UI PLUGIN ─────────────────
        // Generates Fortune-5 aesthetic features without extra npm packages
        plugin(function ({ matchUtilities, addUtilities, theme }) {
            // 1. Text Gradient Utility (Billion-Dollar CTA look)
            addUtilities({
                ".text-gradient-gold": {
                    background: "linear-gradient(135deg, #F8DFB0 0%, #C6923A 50%, #8A6428 100%)",
                    "-webkit-background-clip": "text",
                    "-webkit-text-fill-color": "transparent",
                    "background-clip": "text",
                },
                ".text-gradient-silver": {
                    background: "linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)",
                    "-webkit-background-clip": "text",
                    "-webkit-text-fill-color": "transparent",
                    "background-clip": "text",
                },
                // 2. Hide Scrollbar (Clean Mobile App aesthetic)
                ".scrollbar-hide": {
                    "-ms-overflow-style": "none",
                    "scrollbar-width": "none",
                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                },
                // 3. Optical Masking (Fades edges of directories/lists seamlessly into background)
                ".mask-fade-b": {
                    "mask-image": "linear-gradient(to bottom, black 50%, transparent 100%)",
                    "-webkit-mask-image": "linear-gradient(to bottom, black 50%, transparent 100%)",
                },
                ".mask-fade-r": {
                    "mask-image": "linear-gradient(to right, black 80%, transparent 100%)",
                    "-webkit-mask-image": "linear-gradient(to right, black 80%, transparent 100%)",
                },
                // 4. Advanced Apple-Style Glass Blur Sets 
                ".glass-premium": {
                    "background": "rgba(18, 18, 18, 0.65)",
                    "backdrop-filter": "blur(16px) saturate(180%)",
                    "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
                    "border": "1px solid rgba(255, 255, 255, 0.08)",
                }
            });

            // 5. Dynamic Grid & Dot Patterns (For high-end data visualization backgrounds)
            matchUtilities(
                {
                    "bg-grid": (value) => ({
                        backgroundImage: `url("${svgToDataUri(
                            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
                        )}")`,
                    }),
                    "bg-dot": (value) => ({
                        backgroundImage: `url("${svgToDataUri(
                            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="2" cy="2" r="1"></circle></svg>`
                        )}")`,
                    }),
                },
                { values: theme("backgroundColor"), type: "color" }
            );
        }),
    ],
};

// Helper function to encode SVG for inline CSS backgrounds
function svgToDataUri(svg: string) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' stroke='rgba(255,255,255,0.05)' fill='none'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E`;
}

export default config;
