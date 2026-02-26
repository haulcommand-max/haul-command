
import * as fs from 'fs';
import * as path from 'path';

export interface BrandConfig {
    voice_settings: {
        tone: string;
    };
    vocabulary: {
        mandatory_terms: string[];
        forbidden_terms: string[];
    };
    enforcement_rules: {
        block_save_on_violation: boolean;
        bias: string;
    };
}

export interface ValidationResult {
    isValid: boolean;
    violations: string[];
    score: number; // 0-100
}

export class BrandVoiceEnforcer {
    private config: BrandConfig;

    constructor(configPath: string) {
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            this.config = JSON.parse(raw);
        } catch (err) {
            console.warn('Failed to load brand config, using defaults.');
            this.config = {
                voice_settings: { tone: 'default' },
                vocabulary: { mandatory_terms: [], forbidden_terms: [] },
                enforcement_rules: { block_save_on_violation: false, bias: 'none' }
            };
        }
    }

    validate(text: string): ValidationResult {
        const violations: string[] = [];
        let score = 100;

        const lowerText = text.toLowerCase();

        // 1. Check Forbidden Terms
        for (const term of this.config.vocabulary.forbidden_terms) {
            if (lowerText.includes(term.toLowerCase())) {
                violations.push(`Forbidden term detected: "${term}"`);
                score -= 15;
            }
        }

        // 2. Check Mandatory Terms (Bonus, not penalty usually, but simplified here)
        // Only valid if text is "long enough" to warrant them, e.g. full post.
        // For snippets, we skip.

        // 3. Tone Check (Heuristic: "Sorry", "Oops", "I think")
        const weakWords = ['sorry', 'oops', 'maybe', 'might', 'i think', 'just'];
        for (const word of weakWords) {
            if (lowerText.includes(word)) {
                violations.push(`Weak language detected: "${word}"`);
                score -= 5;
            }
        }

        return {
            isValid: violations.length === 0,
            violations,
            score: Math.max(0, score)
        };
    }

    sanitize(text: string): string {
        // Simple replacer
        let result = text;
        for (const term of this.config.vocabulary.forbidden_terms) {
            const reg = new RegExp(term, 'gi');
            result = result.replace(reg, '[REDACTED]');
        }
        return result;
    }
}
