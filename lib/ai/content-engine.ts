import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 🧠 MASTER PROMPTS FOR AI AUTONOMY
// ==========================================

export const CONTENT_ENGINE_PROMPTS = {
    LESSON_GENERATION: `
You are the Haul Command Logistics OS AI. 
Objective: Generate a highly authoritative, zero-fluff heavy-haul training lesson.

Strict Output Structure (Return JSON):
1. quick_answer: Direct, 2-sentence SEO-optimized featured snippet.
2. step_by_step: Professional protocol, actionable steps.
3. common_mistakes: Specifically "The Fatal Mistake that gets you fired or denied".
4. professional_standard: The 1% elite level expectation for this task.
5. monetization_hook: How this ties into our Premium Compliance Toolkit or Insurance upsell.

Tone: Military precision, elite heavy transport authority, zero beginner fluff. Do not use generic filler words.
`,
    BLOG_TWIN_GENERATION: `
Objective: Convert the raw lesson protocol into a top-of-funnel public blog post or glossary definition.
Optimize for high-intent search queries like "How to secure a superload" or "Pilot car certification requirements".
Structure:
- Title (Keyword optimized)
- Intro hook
- The Protocol (the core truth)
- Why Operators Fail (the pain point)
- CTA: "Access the full compliance kit inside Haul Command"
`
};

export const VISUAL_ENGINE_PROMPTS = {
    PAGE_FAMILY_TAXONOMY: {
        DARK_OPS: `Hyper-realistic, cinematic 8K lighting, midnight logistics operation, heavy haul truck under sodium lights, police escort strobes reflecting off wet asphalt, UI-ready negative space on the left.`,
        COMPLIANCE_WHITE: `Clean, hyper-modern, bright logistics command center, glowing digital map on screen, technical blueprints of superload vectors, high contrast, UI-ready negative space on the right.`,
        ROAD_WARRIOR: `Dawn lighting, massive oversized load crossing a desert highway, dust kicking up, drone angle, epic scale, high definition.`
    }
};

// ==========================================
// ⚙️ THE GENERATION LOOPS
// ==========================================

export class AutonomousContentEngine {
    
    /**
     * Executes the generation loop for a specific lesson title/topic
     */
    static async generateLessonNode(topic: string, trackSlug: string, moduleSlug: string) {
        console.log(`[Content Engine] Initiating generation for: ${topic}`);

        // In a true environment, this calls Gemini/Claude APIs
        // const response = await llmClient.process(CONTENT_ENGINE_PROMPTS.LESSON_GENERATION + " Topic: " + topic);
        const mockupResponse = {
            quick_answer: `${topic} requires strict adherence to federal bridging laws and localized escort positioning.`,
            step_by_step: ["Verify Route IQ.", "Confirm escort positions.", "Check weather curfew."],
            common_mistakes: "Losing visual contact with the rear steer tiller.",
            professional_standard: "Predicting traffic compression events 5 miles out.",
            monetization_hook: "Download the Haul Command Superload Checklist for this specific operation."
        };

        // Insert into Database
        const { data, error } = await supabase.from('hc_training_lessons').insert({
            track_slug: trackSlug,
            module_slug: moduleSlug,
            lesson_slug: topic.toLowerCase().replace(/ /g, '-'),
            title: topic,
            lesson_markdown: JSON.stringify(mockupResponse),
            visual_assets: [
                { type: 'hero_image_prompt', spec: VISUAL_ENGINE_PROMPTS.PAGE_FAMILY_TAXONOMY.DARK_OPS }
            ]
        });

        if (error) {
            console.error('[Content Engine] Write Failed:', error.message);
            return null;
        }

        console.log(`[Content Engine] Finished node: ${topic}`);
        return data;
    }

    /**
     * Triggers a massive build of modules based on predefined curriculums
     */
    static async loopCurriculum(trackInputList: any[]) {
        for (const track of trackInputList) {
            for (const mod of track.modules) {
                for (const lesson of mod.lessons) {
                    await this.generateLessonNode(lesson.title, track.slug, mod.slug);
                }
            }
        }
        console.log('[Content Engine] Full curriculum generation loop complete.');
    }
}
