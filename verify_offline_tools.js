
/**
 * Haul Command - Offline Tools Verification (Standalone JS)
 * Verifies Content Parser and Brand Enforcer
 */

const cheerio = require('cheerio'); // Assume installed
const fs = require('fs');
const path = require('path');

// --- MOCK PARSER LOGIC (Inlined for JS execution) ---
class ContentParser {
    parse(html, schema) {
        const $ = cheerio.load(html);
        if (schema.containerSelector) {
            const items = [];
            $(schema.containerSelector).each((_, el) => {
                items.push(this.extract($, $(el), schema.fields));
            });
            return { success: true, data: items, count: items.length };
        }
        return { success: true, data: this.extract($, $('body'), schema.fields), count: 1 };
    }

    extract($, context, fields) {
        const res = {};
        for (const [key, rule] of Object.entries(fields)) {
            let el = context.find(rule.selector);
            if (context.is(rule.selector)) el = context;
            res[key] = (rule.attribute ? el.attr(rule.attribute) : el.text())?.trim();
        }
        return res;
    }
}

// --- MOCK BRAND ENFORCER LOGIC ---
const BRAND_CONFIG = {
    vocabulary: {
        forbidden_terms: ["Synergy", "Rockstar", "Oops"]
    }
};

class BrandEnforcer {
    validate(text) {
        const violations = [];
        for (const term of BRAND_CONFIG.vocabulary.forbidden_terms) {
            if (text.toLowerCase().includes(term.toLowerCase())) {
                violations.push(`Forbidden: "${term}"`);
            }
        }
        return { isValid: violations.length === 0, violations };
    }
}

// --- TEST RUN ---

console.log('--- TEST 1: HTML Parsing ---');
const html = `
<div class="job-list">
    <div class="job-card">
        <span class="origin">Dallas, TX</span>
        <span class="dest">Tulsa, OK</span>
        <div class="specs" data-weight="120000">120k lbs</div>
    </div>
    <div class="job-card">
        <span class="origin">Houston, TX</span>
        <span class="dest">Miami, FL</span>
        <div class="specs" data-weight="45000">45k lbs</div>
    </div>
</div>
`;

const schema = {
    containerSelector: '.job-card',
    fields: {
        origin: { selector: '.origin' },
        dest: { selector: '.dest' },
        weight: { selector: '.specs', attribute: 'data-weight' }
    }
};

const parser = new ContentParser();
const res = parser.parse(html, schema);
console.log(`Parsed ${res.count} items:`);
console.log(JSON.stringify(res.data, null, 2));

console.log('\n--- TEST 2: Brand Voice ---');
const enforcer = new BrandEnforcer();
const texts = [
    "Dispatch, we are standby at the coordinates.",
    "Oops, I think we rocked this synergy session like rockstars!"
];

texts.forEach(t => {
    const v = enforcer.validate(t);
    console.log(`Text: "${t.substring(0, 30)}..." -> Valid? ${v.isValid}`);
    if (!v.isValid) console.log('Violations:', v.violations);
});
