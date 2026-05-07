import type { HomepageHeroChip } from "./role-chips";

function chipKey(chip: HomepageHeroChip): string {
  return `${chip.type}:${chip.label.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

export function dedupeHeroRoleChips(chips: HomepageHeroChip[]): HomepageHeroChip[] {
  const seen = new Set<string>();

  return chips.filter((chip) => {
    const key = chipKey(chip);
    if (!chip.label.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildHeroRoleWindow(
  chips: HomepageHeroChip[],
  offset: number,
  visibleCount = 3,
): HomepageHeroChip[] {
  const uniqueChips = dedupeHeroRoleChips(chips);
  if (!uniqueChips.length || visibleCount <= 0) return [];

  const count = Math.min(visibleCount, uniqueChips.length);
  const start = ((offset % uniqueChips.length) + uniqueChips.length) % uniqueChips.length;

  return Array.from({ length: count }, (_, index) => uniqueChips[(start + index) % uniqueChips.length]);
}
