/**
 * tests/unit/anti-gaming-engine.test.ts
 * Tests for the Anti-Gaming Hardening Engine (Phase 6)
 */
import { describe, it, expect } from "vitest";
import {
    checkReviewIntegrity,
} from "@/lib/trust/anti-gaming-engine";

describe("Anti-Gaming Engine", () => {
    describe("checkReviewIntegrity", () => {
        it("passes a legitimate review from an established user", () => {
            const result = checkReviewIntegrity(
                {
                    userId: "user-abc",
                    reviewerAge: 365,
                    reviewerReviewCount: 20,
                    reviewerDevice: "device-1",
                    textLength: 120,
                    hasPhotos: true,
                    submittedAt: new Date().toISOString(),
                    targetId: "target-1",
                },
                {
                    reviewsInLastHour: 0,
                    sameIpReviews: 0,
                    sameDeviceReviews: 1,
                    targetRecentReviewCount: 2,
                    avgRatingDeviation: 0.3,
                }
            );
            expect(result.verdict).toBe("pass");
            expect(result.integrityScore).toBeGreaterThan(50);
        });

        it("detects suspicious review from brand-new account", () => {
            const result = checkReviewIntegrity(
                {
                    userId: "user-fake",
                    reviewerAge: 0,
                    reviewerReviewCount: 1,
                    reviewerDevice: "device-sus",
                    textLength: 5,
                    hasPhotos: false,
                    submittedAt: new Date().toISOString(),
                    targetId: "target-1",
                },
                {
                    reviewsInLastHour: 5,
                    sameIpReviews: 8,
                    sameDeviceReviews: 6,
                    targetRecentReviewCount: 15,
                    avgRatingDeviation: 4.5,
                }
            );
            expect(result.verdict).not.toBe("pass");
            expect(result.integrityScore).toBeLessThan(50);
        });

        it("flags IP clustering as suspicious signal", () => {
            const result = checkReviewIntegrity(
                {
                    userId: "user-cluster",
                    reviewerAge: 30,
                    reviewerReviewCount: 5,
                    reviewerDevice: "device-3",
                    textLength: 50,
                    hasPhotos: false,
                    submittedAt: new Date().toISOString(),
                    targetId: "target-2",
                },
                {
                    reviewsInLastHour: 0,
                    sameIpReviews: 10,
                    sameDeviceReviews: 1,
                    targetRecentReviewCount: 1,
                    avgRatingDeviation: 1,
                }
            );
            expect(result.signals.some((s) => s.name === "ip_cluster")).toBe(true);
        });

        it("detects review bombing on a target", () => {
            const result = checkReviewIntegrity(
                {
                    userId: "user-normal",
                    reviewerAge: 90,
                    reviewerReviewCount: 10,
                    reviewerDevice: "device-n",
                    textLength: 80,
                    hasPhotos: true,
                    submittedAt: new Date().toISOString(),
                    targetId: "target-bombed",
                },
                {
                    reviewsInLastHour: 0,
                    sameIpReviews: 0,
                    sameDeviceReviews: 0,
                    targetRecentReviewCount: 25,
                    avgRatingDeviation: 0.5,
                }
            );
            expect(result.signals.some((s) => s.name === "review_bomb")).toBe(true);
        });

        it("returns a numeric integrity score between 0-100", () => {
            const result = checkReviewIntegrity(
                {
                    userId: "u1",
                    reviewerAge: 60,
                    reviewerReviewCount: 10,
                    reviewerDevice: "dev",
                    textLength: 100,
                    hasPhotos: false,
                    submittedAt: new Date().toISOString(),
                    targetId: "t1",
                },
                {
                    reviewsInLastHour: 1,
                    sameIpReviews: 1,
                    sameDeviceReviews: 1,
                    targetRecentReviewCount: 3,
                    avgRatingDeviation: 0.8,
                }
            );
            expect(result.integrityScore).toBeGreaterThanOrEqual(0);
            expect(result.integrityScore).toBeLessThanOrEqual(100);
        });
    });
});
