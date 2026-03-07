import { describe, it, expect } from "vitest";
import { getAvailableVerificationMethods } from "@/lib/places/claim-engine";

describe("getAvailableVerificationMethods", () => {
    it("returns phone methods when phone is present", () => {
        const methods = getAvailableVerificationMethods({ phone: "+15551234567" });
        expect(methods).toContain("phone_otp");
        expect(methods).toContain("voice_callback_verification");
    });

    it("returns website methods when website is present", () => {
        const methods = getAvailableVerificationMethods({ website: "https://example.com" });
        expect(methods).toContain("website_dns");
        expect(methods).toContain("website_html_tag");
        expect(methods).toContain("website_contact_email_token");
    });

    it("always includes email_domain_match regardless of inputs", () => {
        expect(getAvailableVerificationMethods({})).toContain("email_domain_match");
        expect(getAvailableVerificationMethods({ phone: "+1555", website: "https://x.com" })).toContain("email_domain_match");
    });

    it("returns all 6 methods when both phone and website are present", () => {
        const methods = getAvailableVerificationMethods({
            phone: "+15551234567",
            website: "https://example.com",
        });
        expect(methods).toHaveLength(6);
    });

    it("returns only email_domain_match when neither phone nor website present", () => {
        const methods = getAvailableVerificationMethods({});
        expect(methods).toEqual(["email_domain_match"]);
    });

    it("treats null phone as absent", () => {
        const methods = getAvailableVerificationMethods({ phone: null });
        expect(methods).not.toContain("phone_otp");
    });

    it("treats null website as absent", () => {
        const methods = getAvailableVerificationMethods({ website: null });
        expect(methods).not.toContain("website_dns");
    });
});
