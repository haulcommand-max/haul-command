/**
 * ==============================================================================
 * HAUL COMMAND: THE 14-DAY VAPI TRIGGER MATRIX
 * 
 * Objective: We do not wait 90 days. Because of the Semantic Radius Engine, 
 *            long-tail zero-competition keywords rank on Page 1 within 7-10 days.
 *            We strike exactly on Day 14.
 * ==============================================================================
 */

export const VAPI_TRIGGER_PROTOCOL = {
    day_0: "Profile Scraped, Semantic Tags Generated, XML Sitemap Pinged to Google.",
    day_3_to_7: "Googlebot Crawls and Indexes the Long-Tail Radius Tags.",
    day_8_to_13: "Profile achieves #1 Ranking for zero-competition keywords (e.g., 'Pilot Car near Cross City'). Organic traffic begins accumulating.",
    
    // The Psychological Strike
    day_14: {
        action: "Novu SMS Sequence Initiated.",
        psychology: "Proof of Value",
        script: "HAUL COMMAND DISPATCH: Your verified profile just received 12 broker views for [Local City] oversized routing. One broker attempted direct contact but your dialer is locked. Claim profile here: [Link]"
    },
    
    day_17: {
        action: "Vapi Voice Call Execution.",
        psychology: "Urgent Loss Aversion",
        script: "Hey, dispatch here. I sent you a text 3 days ago. You're ranking at the top of our directory for [Local City], but I can't route the escrow payouts to an unverified number. Call me back or verify here: [Link]"
    }
};
