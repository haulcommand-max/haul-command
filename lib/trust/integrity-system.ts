
import { generateProviderFingerprint } from '@/lib/seo/slug-helper';

/**
 * Module 7: Marketplace Integrity + Anti-Spam
 * Purpose: Protect rankings and user trust by filtering low-quality data.
 */

// Disposable domains list (Mock - in prod use a large library)
const DISPOSABLE_DOMAINS = new Set(['tempmail.com', '10minutemail.com', 'throwaway.com']);

export type ListingRiskAnalysis = {
    riskScore: number; // 0 = Safe, 100 = Hazardous
    flags: string[];
    action: 'APPROVE' | 'FLAG_FOR_REVIEW' | 'REJECT';
};

export function analyzeProviderListing(profile: {
    name: string;
    email: string;
    phone: string;
    description: string;
    lat: number;
    lng: number;
}): ListingRiskAnalysis {
    const flags: string[] = [];
    let riskScore = 0;

    // 1. Email Domain Check
    const emailDomain = profile.email.split('@')[1]?.toLowerCase();
    if (DISPOSABLE_DOMAINS.has(emailDomain)) {
        flags.push('DISPOSABLE_EMAIL');
        riskScore += 90;
    }

    // 2. Description Quality
    if (!profile.description || profile.description.length < 50) {
        flags.push('THIN_DESCRIPTION');
        riskScore += 20;
    }
    if (profile.description.toUpperCase() === profile.description) {
        flags.push('ALL_CAPS_DESCRIPTION');
        riskScore += 10;
    }

    // 3. Duplicate Detection Hash (Conceptual)
    // const fingerprint = generateProviderFingerprint(profile);
    // if (database.exists(fingerprint)) { ... } 

    // Decision Logic
    let action: ListingRiskAnalysis['action'] = 'APPROVE';
    if (riskScore >= 80) action = 'REJECT';
    else if (riskScore >= 40) action = 'FLAG_FOR_REVIEW';

    return { riskScore, flags, action };
}

export function validateLoadPosting(load: {
    originCity: string;
    destCity: string;
    loadDate: string;
    contactPhone: string;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!load.originCity || !load.destCity) errors.push('Missing route endpoints');
    if (!load.loadDate) errors.push('Missing load date');
    // Basic phone validation (10+ digits)
    if (load.contactPhone.replace(/\D/g, '').length < 10) errors.push('Invalid phone number');

    return {
        valid: errors.length === 0,
        errors
    };
}
