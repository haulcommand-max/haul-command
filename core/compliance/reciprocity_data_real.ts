
export interface ReciprocityRule {
    state: string;
    acceptedStates: string[];
    notes: string;
}

/**
 * Real-world Pilot Car Reciprocity Rules extracted from NotebookLM
 * Source: "Mastering Anti-Gravity: The Definitive AI App Building Masterclass"
 * Extraction Date: 2026-02-17
 * 
 * NOTE: "acceptedStates" means the 'state' recognizes certifications FROM these states.
 */
export const REAL_RECIPROCITY_DATA: ReciprocityRule[] = [
    {
        state: "AZ",
        acceptedStates: ["CO", "FL", "KS", "MN", "NC", "NY", "OK", "UT", "VA", "WA"],
        notes: "Must be 18+ with valid license. Certification training must be repeated every 4 years."
    },
    {
        state: "CO",
        acceptedStates: ["AZ", "MN", "OK", "UT", "WA"], // and SC&RA
        notes: "Drivers must carry CO State Certification card, vertical clearance map, and proof of $1M insurance."
    },
    {
        state: "FL",
        acceptedStates: ["AZ", "CO", "GA", "MN", "NC", "OK", "PA", "VA", "WA", "WI"],
        notes: "Drivers must be 18+ and complete 8-hour defensive driving (or CDL) + 8-hour pilot/escort flagging course."
    },
    {
        state: "GA",
        acceptedStates: ["FL", "NC", "OK", "WA", "AZ", "CO", "UT", "VA"], // "Likely approve" AZ, CO, UT, VA if amber light permit held
        notes: "Operators must obtain 'amber light permit' and complete Certified Escort Vehicle Program. Digital cards only."
    },
    {
        state: "KS",
        acceptedStates: ["CO", "WA"],
        notes: "Escort vehicles must be registered with KS Secretary of Transportation (Free, 1 year validity)."
    },
    {
        state: "MN",
        acceptedStates: ["CO", "FL", "NC", "OK", "UT", "VA", "WA"],
        notes: "Operators must hold current certification and carry MN-specific insurance."
    },
    {
        state: "NY",
        acceptedStates: [], // "New York does not recognize escort vehicle certifications issued in other states"
        notes: "Must be 21+ and pass specific testing process in NY. Out-of-state drivers must obtain NY MV-64 card."
    },
    {
        state: "NC",
        acceptedStates: ["AZ", "FL", "GA", "MN", "OK", "PA", "UT", "VA", "WA"],
        notes: "First-time applicants: 8-hour course by NC Community College + certified driving record."
    },
    {
        state: "OK",
        acceptedStates: ["CO", "FL", "GA", "MN", "NC", "UT", "VA", "WA"],
        notes: "Drivers must be certified by DPS and hold $1M insurance coverage."
    },
    {
        state: "PA",
        acceptedStates: ["GA", "NC", "VA", "CO", "UT", "FL", "WA"], // Source lists GA, NC, VA, CO, UT. Other sources add FL, WA.
        notes: "Must be 21+ with 3 years experience. Drivers in lieu of State Police must complete 8-hour course."
    },
    {
        state: "TX",
        acceptedStates: ["CO", "WA"],
        notes: "Certification required specifically for escort flaggers (TCOLE approved program)."
    },
    {
        state: "UT",
        acceptedStates: ["AZ", "CO", "FL", "MN", "NC", "OK", "VA", "WA"],
        notes: "Pass certification program + 40-question test (80%+). Valid 4 years. $750k liability insurance."
    },
    {
        state: "VA",
        acceptedStates: ["FL", "GA", "MN", "NC", "OK", "UT", "WA"],
        notes: "Must be 18+, pass certification test, pay fee. Valid 5 years."
    },
    {
        state: "WA",
        acceptedStates: ["AZ", "CO", "GA", "MN", "NC", "OK", "UT", "VA"], // 2024 sources list these
        notes: "Must be 18+, complete 8-hour instructor-led course, pass exam. Valid 3 years."
    },
    {
        state: "WI",
        acceptedStates: ["AZ", "CO", "FL", "GA", "MN", "NC", "OK", "PA", "UT", "VA", "WA"], // "Accepts other states with 8-hour+ training" -> assuming overlap with FL/WA/NC/etc
        notes: "Requires valid operator's license. Accepts certifications from states with 8-hour+ training programs."
    }
];
