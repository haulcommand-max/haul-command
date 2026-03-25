import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const AgentExtractionSchema = z.object({
    entities: z.array(z.object({
        type: z.enum(['operator', 'broker', 'hotel', 'truck_stop', 'authority', 'installer', 'other']),
        name: z.string().describe('The verified business name of the entity'),
        description: z.string().optional().describe('Brief description of what the entity does'),
        primary_phone: z.string().optional().describe('The primary contact phone number'),
        primary_email: z.string().optional().describe('The primary contact email address'),
        website: z.string().optional().describe('The primary website URL for the entity'),
        country_code: z.string().optional().describe('ISO 2-letter country code, usually US or CA'),
        region: z.string().optional().describe('State or province name (e.g. Florida, TX)'),
        city: z.string().optional().describe('City name'),
        certifications: z.array(z.object({
            cert_name: z.string(),
            issuing_authority: z.string().optional(),
        })).optional(),
        social_links: z.array(z.object({
            platform: z.string(),
            url: z.string()
        })).optional().describe('Any discovered social media links like Facebook, LinkedIn')
    })),
    contacts: z.array(z.object({
        name: z.string(),
        role: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        linkedin: z.string().optional(),
    })).optional(),
    locations: z.array(z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country_code: z.string().optional()
    })).optional(),
    services: z.array(z.object({
        service_type: z.string().describe('Specific service offered (e.g. Pilot Car, Route Surveys)'),
        coverage_area: z.array(z.string()).optional().describe('States or region the service is offered in')
    })).optional()
});

export type AgentExtractionResult = z.infer<typeof AgentExtractionSchema>;

/**
 * Passes raw text/HTML to Gemini 2.0 (Pro/Flash) to interpret and structure 
 * the unstructured data into entities, contacts, locations, and services.
 */
export async function aiExtractFromText(pageText: string, sourceUrl: string): Promise<AgentExtractionResult | null> {
    try {
        const { object } = await generateObject({
            // Assuming gemini is configured and the environment has GOOGLE_GENERATIVE_AI_API_KEY
            // The user asked for "Gemini Pro 3.x", using gemini-2.5-pro or gemini-2.0-pro-exp.
            model: google('gemini-2.5-pro'), 
            schema: AgentExtractionSchema,
            temperature: 0.1,
            prompt: `
You are Haul Command's core Anti-Gravity Ingestion Engine extraction agent.
You extract transport, logistics, and infrastructure intelligence from noisy web scrapes.

Source URL: ${sourceUrl}

Analyze the following scraped page text. Look for:
1. Business Entities (Pilot Car Operators, Truck Stops, Hotels, Brokers)
2. Contacts (Names, roles, direct phone numbers, emails)
3. Geographic locations
4. Specific services and coverage areas (e.g., "covering Florida and Georgia")
5. Certifications and Authorities

Be extremely precise. 
- Do not invent information. 
- If none is found, return empty arrays.
- Convert textual state names into state abbreviations where possible.

Raw Page Content:
---
${pageText.substring(0, 30000)} 
---
`,
        });

        return object;
    } catch (e) {
        console.error('Gemini extraction failed:', e);
        return null;
    }
}
