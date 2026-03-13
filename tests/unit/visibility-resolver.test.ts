/**
 * tests/unit/visibility-resolver.test.ts
 * Tests for the Visibility Resolver (Phase 7)
 */
import { describe, it, expect } from "vitest";
import {
    resolveVisibility,
    canViewMedia,
    getCompareAccess,
    getVisibleSections,
    shouldIndex,
    getMetaRobots,
    DEFAULT_VISIBILITY,
    type VisibilitySettings,
    type ResolvedVisibility,
} from "@/lib/trust/visibility-resolver";

describe("Visibility Resolver", () => {
    describe("resolveVisibility", () => {
        it("grants profile access for anonymous with public settings", () => {
            const vis = resolveVisibility("anonymous", DEFAULT_VISIBILITY);
            expect(vis.can_view_profile).toBe(true);
            expect(vis.can_view_contact).toBe(false);
            expect(vis.tier).toBe("anonymous");
        });

        it("grants full access for claimed owner", () => {
            const vis = resolveVisibility("claimed_owner", DEFAULT_VISIBILITY);
            expect(vis.can_view_profile).toBe(true);
            expect(vis.can_manage_visibility).toBe(true);
        });

        it("grants full access for admin", () => {
            const vis = resolveVisibility("admin", DEFAULT_VISIBILITY);
            expect(vis.can_view_profile).toBe(true);
            expect(vis.can_view_contact).toBe(true);
            expect(vis.can_manage_visibility).toBe(true);
        });

        it("respects non-public profile settings", () => {
            const restrictedSettings: VisibilitySettings = {
                public_profile_visible: false,
                public_report_card_visible: false,
                public_media_visible: false,
                public_contact_visible: false,
            };
            const vis = resolveVisibility("anonymous", restrictedSettings);
            expect(vis.can_view_profile).toBe(false);
        });
    });

    describe("canViewMedia", () => {
        it("allows public media for anonymous with public settings", () => {
            const resolved = resolveVisibility("anonymous", DEFAULT_VISIBILITY);
            expect(canViewMedia("public", resolved)).toBe(true);
        });

        it("blocks subscriber_only media for anonymous", () => {
            const resolved = resolveVisibility("anonymous", DEFAULT_VISIBILITY);
            expect(canViewMedia("subscriber_only", resolved)).toBe(false);
        });

        it("allows subscriber_only media for paid tier", () => {
            const resolved = resolveVisibility("paid", DEFAULT_VISIBILITY);
            expect(canViewMedia("subscriber_only", resolved)).toBe(true);
        });

        it("blocks private_owner_only for paid tier", () => {
            const resolved = resolveVisibility("paid", DEFAULT_VISIBILITY);
            expect(canViewMedia("private_owner_only", resolved)).toBe(false);
        });

        it("allows private_owner_only for claimed_owner", () => {
            const resolved = resolveVisibility("claimed_owner", DEFAULT_VISIBILITY);
            expect(canViewMedia("private_owner_only", resolved)).toBe(true);
        });
    });

    describe("getCompareAccess", () => {
        it("returns compare config for each tier", () => {
            const anonAccess = getCompareAccess("anonymous");
            const paidAccess = getCompareAccess("paid");
            expect(typeof anonAccess).toBe("object");
            expect(typeof paidAccess).toBe("object");
        });
    });

    describe("getVisibleSections", () => {
        it("returns array of visible sections", () => {
            const anonSections = getVisibleSections("anonymous");
            const paidSections = getVisibleSections("paid");
            expect(Array.isArray(anonSections)).toBe(true);
            expect(Array.isArray(paidSections)).toBe(true);
            expect(paidSections.length).toBeGreaterThanOrEqual(anonSections.length);
        });
    });

    describe("shouldIndex", () => {
        it("indexes public visible profiles", () => {
            expect(shouldIndex(DEFAULT_VISIBILITY)).toBe(true);
        });

        it("does not index non-public profiles", () => {
            expect(shouldIndex({
                public_profile_visible: false,
                public_report_card_visible: false,
                public_media_visible: false,
                public_contact_visible: false,
            })).toBe(false);
        });
    });

    describe("getMetaRobots", () => {
        it("returns index,follow for public profiles", () => {
            const robots = getMetaRobots(DEFAULT_VISIBILITY);
            expect(robots).toContain("index");
        });

        it("returns noindex for hidden profiles", () => {
            const robots = getMetaRobots({
                public_profile_visible: false,
                public_report_card_visible: false,
                public_media_visible: false,
                public_contact_visible: false,
            });
            expect(robots).toContain("noindex");
        });
    });
});
