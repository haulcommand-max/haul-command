// lib/ui/initialsAvatar.ts
// ══════════════════════════════════════════════════════════════
// Deterministic initials-based avatar — Haul Command
//
// No fake people, no AI-generated faces.
// Returns a data-URI SVG for any name string.
//
// Usage:
//   import { initialsAvatarDataUrl } from "@/lib/ui/initialsAvatar";
//   <img src={initialsAvatarDataUrl("John Smith")} alt="JS" />
//
//   Or in Next.js Image:
//   <Image src={initialsAvatarDataUrl(name)} ... unoptimized />
// ══════════════════════════════════════════════════════════════

/**
 * Generates a deterministic background color from initials.
 * Warm palette so every avatar still feels on-brand.
 */
const AVATAR_PALETTE = [
    "#6B4A1C", // deep gold-brown
    "#8A6428", // warm brown
    "#1E3A5F", // navy
    "#2D5F3E", // forest
    "#7C3238", // burgundy
    "#4A3B6B", // plum
    "#3B6B5F", // teal
    "#5C4033", // coffee
] as const;

function pickColor(initials: string): string {
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
        hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/**
 * Extract up to 2 initials from a display name.
 * Falls back to "HC" if name is empty/missing.
 */
function extractInitials(name?: string | null): string {
    if (!name?.trim()) return "HC";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(s => s[0]?.toUpperCase() ?? "")
        .join("") || "HC";
}

/**
 * Returns a data:image/svg+xml URI for an initials avatar.
 * Deterministic — same name always returns the same image.
 *
 * @param name - Display name (e.g., "John Smith")
 * @param size - SVG viewBox size (default 256)
 */
export function initialsAvatarDataUrl(name?: string | null, size = 256): string {
    const initials = extractInitials(name);
    const bg = pickColor(initials);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.156)}" ry="${Math.round(size * 0.156)}" fill="${bg}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif"
    font-size="${Math.round(size * 0.375)}" font-weight="700" fill="#F9FAFB">${initials}</text>
</svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Helper: returns the photo URL if present, else the initials avatar.
 * Use this everywhere you render a user/operator image.
 */
export function resolveAvatarUrl(photoUrl?: string | null, displayName?: string | null): string {
    if (photoUrl && photoUrl.trim()) return photoUrl;
    return initialsAvatarDataUrl(displayName);
}

export default initialsAvatarDataUrl;
