import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { COUNTRY_REGISTRY } from "@/lib/config/country-registry";

type CountryContext = {
    countryCode: string;
    regionCode?: string | null;
    languageCode?: string | null;
    currencyCode?: string | null;
    roleContext?: string | null;
    countryName?: string | null;
    localTone?: string | null;
};

function normalizeCountryCode(value: unknown): string {
    const code = String(value || "US").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : "US";
}

function getCountryContext(input: Partial<CountryContext>): Required<CountryContext> {
    const countryCode = normalizeCountryCode(input.countryCode);
    const country = COUNTRY_REGISTRY.find(c => c.code.toUpperCase() === countryCode);
    return {
        countryCode,
        regionCode: input.regionCode || null,
        languageCode: input.languageCode || country?.languagePrimary || "en",
        currencyCode: input.currencyCode || country?.currency || "USD",
        roleContext: input.roleContext || "profile_claim",
        countryName: input.countryName || country?.name || countryCode,
        localTone: input.localTone || country?.tone || "operator_practical",
    };
}

function buildPersonaInstruction(ctx: Required<CountryContext>): string {
    const country = COUNTRY_REGISTRY.find(c => c.code.toUpperCase() === ctx.countryCode);
    const language = ctx.languageCode || country?.languagePrimary || "en";
    const secondary = country?.languageSecondary ? ` If the prospect answers in ${country.languageSecondary}, switch naturally to that language.` : "";

    return [
        `Adopt the local business communication style for ${ctx.countryName}.`,
        `Primary language: ${language}. Currency: ${ctx.currencyCode}.`,
        ctx.regionCode ? `Use local region context: ${ctx.regionCode}.` : "Do not invent a local region if it was not provided.",
        `Tone target: ${ctx.localTone}.`,
        `Role context: ${ctx.roleContext}.`,
        secondary,
        "Use heavy-haul terminology that fits the market. Do not force U.S.-only terms like PEVO, DOT, FMCSA, state permit, or pilot car unless the country context supports them.",
        "For compliance claims, be careful: say Haul Command helps verify and organize information, but final legal requirements depend on the local authority and permit office.",
    ].join(" ");
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            targetPhone,
            entityId,
            programType = "profile_claim",
            countryCode,
            regionCode,
            languageCode,
            currencyCode,
            roleContext,
            countryContext: suppliedCountryContext,
        } = body;

        if (!targetPhone || !entityId) {
            return NextResponse.json({ error: "targetPhone and entityId are required" }, { status: 400 });
        }

        const ctx = getCountryContext({
            ...(suppliedCountryContext || {}),
            countryCode: countryCode || suppliedCountryContext?.countryCode,
            regionCode: regionCode || suppliedCountryContext?.regionCode,
            languageCode: languageCode || suppliedCountryContext?.languageCode,
            currencyCode: currencyCode || suppliedCountryContext?.currencyCode,
            roleContext: roleContext || suppliedCountryContext?.roleContext || programType,
        });

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        
        // HYBRID LCR (LEAST COST ROUTING) DEPLOYMENT
        // T1 (Telnyx) is cheaper in core markets. T2 (Twilio) provides 120-country fallback.
        const telnyxCoreRegions = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'];
        
        // Retrieve explicit hybrid trunk IDs, or fallback to legacy single trunk
        const telnyxTrunkId = process.env.LIVEKIT_SIP_TRUNK_TELNYX || process.env.LIVEKIT_SIP_TRUNK_ID;
        const twilioTrunkId = process.env.LIVEKIT_SIP_TRUNK_TWILIO || process.env.LIVEKIT_SIP_TRUNK_ID;

        // Dynamic Trunk Selection: Route to T1 if supported, T2 if edge/remote
        const sipTrunkId = telnyxCoreRegions.includes(ctx.countryCode) 
            ? telnyxTrunkId 
            : twilioTrunkId;

        if (!apiKey || !apiSecret || !sipTrunkId) {
            console.warn("LiveKit SIP credentials missing - skipping outbound dispatch.");
            return NextResponse.json({ error: "LiveKit SIP hybrid nodes not configured" }, { status: 500 });
        }

        const supabase = await createClient();

        const roomName = `outbound_${programType}_${entityId}_${Date.now()}`;

        const personaInstruction = buildPersonaInstruction(ctx);

        // Psychological behavior fallbacks. Keep this compliant: value-first, consent-aware, DNC-respecting.
        const psychologicalDirectives = `
            STRATEGY:
            - Qualify quickly in the first 10 seconds using the supplied country/region context.
            - Value-first: explain that claiming is free and helps route relevant broker/operator opportunities.
            - Do not fabricate leads, revenue, search demand, social proof, authority status, or compliance facts.
            - Ask permission before continuing if the person sounds busy.

            FALLBACK AND ANGER BEHAVIOR:
            - If they get angry or defensive: drop the pitch, acknowledge, and offer removal from future outreach.
            - If they explicitly request removal: say "No problem, taking you off the list now, have a safe drive," and trigger the DNC/remove flow.
            - If they hang up mid-sentence: do not call back automatically. Route them to a compliant SMS/email fallback only if consent and local rules allow it.
        `;

        const systemInstruction = `Outbound Haul Command sequence for ${programType}. ${personaInstruction} ${psychologicalDirectives}`;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL 
            ? process.env.NEXT_PUBLIC_LIVEKIT_WS_URL.replace('wss://', 'https://') 
            : 'https://haulcommand.livekit.cloud';

        const livekitMetadata = {
            programType,
            targetPhone,
            entityId,
            country_code: ctx.countryCode,
            region_code: ctx.regionCode,
            language_code: ctx.languageCode,
            currency_code: ctx.currencyCode,
            role_context: ctx.roleContext,
            local_tone: ctx.localTone,
            system_instruction: systemInstruction,
        };

        const res = await fetch(`${livekitUrl}/twirp/livekit.SIP/CreateSIPParticipant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sip_trunk_id: sipTrunkId,
                sip_call_to: targetPhone,
                room_name: roomName,
                participant_identity: `bot_${programType}`,
                metadata: JSON.stringify(livekitMetadata) 
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`LiveKit SIP error: ${errBody}`);
        }

        // Log the event as "dialed"
        await supabase.from('livekit_outbound_eligibility').update({ 
            status: 'dialed', 
            last_called_at: new Date().toISOString() 
        }).eq('entity_id', entityId);

        await supabase.from('livekit_call_events').insert({
            room_name: roomName,
            participant_identity: `bot_${programType}`,
            call_type: 'outbound_sip',
            status: 'initiated',
            system_instruction: systemInstruction,
            country_code: ctx.countryCode,
            region_code: ctx.regionCode,
            metadata: livekitMetadata,
        }).then(({ error }) => {
            if (error?.message?.includes('column')) {
                return supabase.from('livekit_call_events').insert({
                    room_name: roomName,
                    participant_identity: `bot_${programType}`,
                    call_type: 'outbound_sip',
                    status: 'initiated',
                    system_instruction: systemInstruction,
                });
            }
            return undefined;
        });

        return NextResponse.json({ success: true, roomName, country_context: ctx }, { status: 200 });

    } catch (e: any) {
        console.error("LiveKit Outbound Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
