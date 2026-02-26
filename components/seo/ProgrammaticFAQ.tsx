'use client';

// ══════════════════════════════════════════════════════════════
// PROGRAMMATIC FAQ ENGINE (Killer Move #9)
// Auto-generates FAQ sections with FAQPage schema markup
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
    question: string;
    answer: string;
}

// City + service FAQ generator
export function getCityFAQs(city: string, state: string): FAQItem[] {
    return [
        {
            question: `When is a pilot car required in ${state}?`,
            answer: `In ${state}, a pilot car (escort vehicle) is typically required for loads exceeding 12 feet wide, 14 feet tall, or 80,000 lbs gross weight. Specific thresholds vary — use the Haul Command state requirements tool to verify current rules.`,
        },
        {
            question: `How much does a pilot car cost in ${city}, ${state}?`,
            answer: `Pilot car rates in ${city}, ${state} typically range from $280–$600/day for local moves and $400–$900+ for long-haul work. Per-mile rates average $1.50–$2.20. Use the Haul Command Rate Lookup for real-time market data.`,
        },
        {
            question: `How do I find a certified escort vehicle operator in ${city}?`,
            answer: `Haul Command's verified directory lists certified escort operators in ${city}, ${state} with verified credentials, equipment lists, and real-time availability. Filter by certification status, equipment type, and distance.`,
        },
        {
            question: `Are there pilot car jobs available in ${city}, ${state}?`,
            answer: `Yes. Haul Command matches independent pilot car drivers with brokers and carriers in the ${city} area. Create a free driver profile to receive load notifications and direct booking requests.`,
        },
        {
            question: `What equipment does a pilot car driver need in ${state}?`,
            answer: `${state} typically requires amber lights (roof-mounted bar preferred), oversize load signs (front and rear), a height pole for loads over 14', and a CB radio or cell communication device. Some routes also require a state pilot car certification card.`,
        },
    ];
}

export function getStateFAQs(state: string, stateName: string): FAQItem[] {
    return [
        {
            question: `What are the pilot car certification requirements in ${stateName}?`,
            answer: `${stateName} pilot car certification requirements include minimum age, clean driving record, proof of liability insurance ($300K–$1M depending on carrier), and in most states, completion of a state-approved pilot car operator course.`,
        },
        {
            question: `Does ${stateName} have reciprocity with other states for pilot car certification?`,
            answer: `Some states accept out-of-state pilot car certifications. Haul Command's state requirements cheatsheet shows which states ${stateName} has reciprocity agreements with. Always verify with the state DOT before operating.`,
        },
        {
            question: `How wide does a load have to be to require an escort in ${stateName}?`,
            answer: `In ${stateName}, most oversize loads exceeding 12 feet in width require a rear escort vehicle. Loads over 14–16 feet wide typically require both front and rear escort. Superloads may require police escort.`,
        },
    ];
}

export function getCountyFAQs(countyName: string, state: string): FAQItem[] {
    return [
        {
            question: `Is there a pilot car driver shortage in ${countyName}, ${state}?`,
            answer: `${countyName} is flagged as a high-opportunity zone by Haul Command's supply gap model. Demand from heavy haul activity significantly outpaces the available certified escort driver supply, creating above-market rates for qualified operators.`,
        },
        {
            question: `What kind of loads need escort vehicles in ${countyName}?`,
            answer: `${countyName} sees heavy haul loads including oil field equipment, wind turbine components, agricultural machinery, and pipeline infrastructure — all requiring certified pilot car escorts under state and federal oversize regulations.`,
        },
        {
            question: `How do escort drivers get work in ${countyName}, ${state}?`,
            answer: `Create a Haul Command driver profile to receive real-time load notifications in ${countyName}. The platform connects you directly with carriers and brokers dispatching in this high-demand corridor.`,
        },
    ];
}

// Generic FAQs
export function getGenericFAQs(topic: 'cost' | 'rules' | 'jobs' | 'certification'): FAQItem[] {
    const maps: Record<string, FAQItem[]> = {
        cost: [
            { question: 'How much does a pilot car service cost?', answer: 'Pilot car costs range from $250–$900/day depending on state, distance, and load complexity. Per-mile rates average $1.50–$2.20. Rural corridors and superloads command premium rates.' },
            { question: 'What factors affect pilot car pricing?', answer: 'Key factors: number of states crossed (each requires permits), load width and height, urgency, time of move (night moves often cost more), and whether police escort is mandated.' },
        ],
        rules: [
            { question: 'When is a pilot car legally required?', answer: 'Federal guidelines and most state DOT rules require a pilot car when a load exceeds 12 feet wide, 14 feet tall, or is otherwise designated as oversize/overweight. Exact thresholds vary by state.' },
            { question: 'Do pilot car rules differ by state?', answer: 'Yes significantly. Width, height, and weight triggers for escort requirements vary across all 50 states. Use the Haul Command State Requirements Cheatsheet for a state-by-state breakdown.' },
        ],
        jobs: [
            { question: 'How do I get pilot car jobs?', answer: 'Join the Haul Command network for free. Create a driver profile, verify your credentials, and receive direct load notifications. Many drivers earn $500–$1,200/day on heavy haul corridors.' },
            { question: 'What qualifications do I need to work as a pilot car driver?', answer: 'Requirements vary by state, but typically: valid driver\'s license, clean driving record, liability insurance ($300K+), oversize load equipment, and state certification where required.' },
        ],
        certification: [
            { question: 'How do I get certified as a pilot car operator?', answer: 'Complete a state-approved pilot car operator course (online or in-person, typically $50–$150). Pass the exam, obtain liability insurance, and equip your vehicle with required safety equipment.' },
            { question: 'How long does pilot car certification take?', answer: 'Most state certification courses take 4–8 hours and can be completed online. Background checks and insurance acquisition may add 1–3 days.' },
        ],
    };
    return maps[topic] ?? [];
}

// FAQ Component
interface ProgrammaticFAQProps {
    faqs: FAQItem[];
    title?: string;
}

export function ProgrammaticFAQ({ faqs, title = 'Frequently Asked Questions' }: ProgrammaticFAQProps) {
    const [openIdx, setOpenIdx] = React.useState<number | null>(null);

    return (
        <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</h2>

            {/* FAQPage schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map(f => ({
                        '@type': 'Question',
                        name: f.question,
                        acceptedAnswer: { '@type': 'Answer', text: f.answer },
                    })),
                })
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {faqs.map((faq, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${openIdx === i ? 'rgba(241,169,27,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 12, overflow: 'hidden',
                    }}>
                        <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{
                            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12,
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: openIdx === i ? '#F1A91B' : '#d1d5db', flex: 1, lineHeight: 1.4 }}>{faq.question}</span>
                            <ChevronDown style={{ width: 14, height: 14, color: '#4b5563', transform: openIdx === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </button>
                        {openIdx === i && (
                            <div style={{ padding: '0 16px 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>{faq.answer}</div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
