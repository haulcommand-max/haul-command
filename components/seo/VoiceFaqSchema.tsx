/**
 * VoiceFaqSchema — JSON-LD FAQPage generator from Voice Intent Engine
 * 
 * Generates FAQPage structured data from voice intent clusters,
 * enabling featured snippet capture, voice search dominance,
 * and AI-citation-ready content on regulation/tool/glossary pages.
 * 
 * Usage:
 *   <VoiceFaqSchema
 *     language="en"
 *     geoEntity="Texas"
 *     pageType="regulation"
 *     maxQuestions={8}
 *   />
 */

import { VOICE_INTENT_CLUSTERS, type VoiceIntentCluster } from '@/lib/voice/voice-intent-engine';

interface VoiceFaqSchemaProps {
    language?: string;
    geoEntity?: string;
    pageType?: 'regulation' | 'tool' | 'glossary' | 'directory' | 'corridor' | 'rate';
    maxQuestions?: number;
    /** Additional custom Q&A pairs to merge into the schema */
    customQA?: Array<{ question: string; answer: string }>;
}

// Page-type → intent cluster mapping
const PAGE_INTENT_MAP: Record<string, string[]> = {
    regulation: ['compliance_questions', 'emergency_high_intent', 'broker_sourcing'],
    tool: ['compliance_questions', 'pricing_questions', 'broker_sourcing'],
    glossary: ['compliance_questions', 'emergency_high_intent'],
    directory: ['broker_sourcing', 'emergency_high_intent', 'pricing_questions'],
    corridor: ['emergency_high_intent', 'broker_sourcing', 'pricing_questions'],
    rate: ['pricing_questions', 'broker_sourcing', 'compliance_questions'],
};

// Smart answer generator — maps intent templates to authoritative answers
function generateAnswer(template: string, geo?: string): string {
    const geoLabel = geo || 'your area';

    // Compliance/regulation questions
    if (template.includes('do I need') || template.includes('require')) {
        return `Escort vehicle and pilot car requirements vary by jurisdiction. In ${geoLabel}, oversize loads exceeding width, height, or length thresholds typically require one or more certified escort vehicles. Check the specific regulations for ${geoLabel} on Haul Command for exact thresholds, permit requirements, and escort positioning rules.`;
    }
    if (template.includes('how many') && template.includes('escort')) {
        return `The number of escort vehicles required depends on load dimensions and the jurisdiction. Most states require 1 escort for loads over 12 feet wide, and 2 escorts for loads over 14-16 feet wide. In ${geoLabel}, check the specific width/height/length thresholds on our regulations page.`;
    }
    if (template.includes('permit') || template.includes('license')) {
        return `Oversize load permits are required in most jurisdictions when loads exceed standard legal dimensions. In ${geoLabel}, permits are typically issued by the state DOT or transport authority. Haul Command provides state-by-state permit requirement guides and cost estimates.`;
    }

    // Pricing questions
    if (template.includes('cost') || template.includes('rate') || template.includes('charge') || template.includes('price')) {
        return `Pilot car and escort vehicle rates in ${geoLabel} typically range from $350-$700 per day depending on load complexity, route distance, and urgency. Use the Haul Command Instant Quote tool for real-time pricing estimates based on your specific load dimensions and route.`;
    }

    // Emergency/availability
    if (template.includes('near me') || template.includes('available') || template.includes('find')) {
        return `Find certified pilot car operators and escort vehicles near ${geoLabel} on the Haul Command directory. Filter by availability, ratings, certifications, and services. Many operators offer same-day emergency dispatch for urgent oversize load escorts.`;
    }

    // Default authoritative answer
    return `Haul Command is the comprehensive resource for pilot car and escort vehicle services in ${geoLabel}. Search our directory of verified operators, check regulations, get instant quotes, and access route intelligence tools.`;
}

export default function VoiceFaqSchema({
    language = 'en',
    geoEntity,
    pageType = 'regulation',
    maxQuestions = 8,
    customQA = [],
}: VoiceFaqSchemaProps) {
    const relevantClusterIds = PAGE_INTENT_MAP[pageType] || PAGE_INTENT_MAP.regulation;

    const relevantClusters = VOICE_INTENT_CLUSTERS.filter(
        cluster => relevantClusterIds.includes(cluster.id)
    );

    // Build Q&A pairs from voice intent templates
    const voiceQA: Array<{ question: string; answer: string }> = [];

    for (const cluster of relevantClusters) {
        for (const template of cluster.templates.slice(0, 3)) {
            // Convert statement-style templates to proper questions
            let question = template;
            if (geoEntity) {
                question = question.replace('{city}', geoEntity).replace('{region}', geoEntity);
            }
            // Capitalize first letter and add question mark
            question = question.charAt(0).toUpperCase() + question.slice(1);
            if (!question.endsWith('?')) question += '?';

            voiceQA.push({
                question,
                answer: generateAnswer(template, geoEntity),
            });
        }
    }

    // Merge custom Q&A + deduplicate
    const allQA = [...customQA, ...voiceQA];
    const seen = new Set<string>();
    const uniqueQA = allQA.filter(qa => {
        const key = qa.question.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, maxQuestions);

    if (uniqueQA.length === 0) return null;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': uniqueQA.map(qa => ({
            '@type': 'Question',
            'name': qa.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': qa.answer,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * QuickAnswerBlock — Renders the top voice-intent Q&A as visible
 * content blocks for SGE/featured snippet capture.
 */
export function QuickAnswerBlock({
    language = 'en',
    geoEntity,
    pageType = 'regulation',
    maxQuestions = 3,
}: Omit<VoiceFaqSchemaProps, 'customQA'>) {
    const relevantClusterIds = PAGE_INTENT_MAP[pageType] || PAGE_INTENT_MAP.regulation;
    const relevantClusters = VOICE_INTENT_CLUSTERS.filter(
        cluster => relevantClusterIds.includes(cluster.id)
    );

    const qaBlocks: Array<{ question: string; answer: string }> = [];
    for (const cluster of relevantClusters) {
        for (const template of cluster.templates.slice(0, 2)) {
            let question = template;
            if (geoEntity) {
                question = question.replace('{city}', geoEntity).replace('{region}', geoEntity);
            }
            question = question.charAt(0).toUpperCase() + question.slice(1);
            if (!question.endsWith('?')) question += '?';
            qaBlocks.push({ question, answer: generateAnswer(template, geoEntity) });
        }
        if (qaBlocks.length >= maxQuestions) break;
    }

    if (qaBlocks.length === 0) return null;

    return (
        <div className="mb-8 space-y-3">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
                Quick Answers
            </h2>
            {qaBlocks.slice(0, maxQuestions).map((qa, i) => (
                <details
                    key={i}
                    className="group bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden"
                    open={i === 0}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.05] transition-colors">
                        <span className="text-sm font-bold text-white pr-4">{qa.question}</span>
                        <span className="text-gray-600 group-open:rotate-180 transition-transform text-xs">▼</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                        {qa.answer}
                    </div>
                </details>
            ))}
        </div>
    );
}
