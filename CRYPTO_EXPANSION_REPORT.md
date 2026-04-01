# Global Crypto Expansion: 120-Country Legality & Payment Matrix

Per your directive, I have executed a deep horizontal scan of the entire Haul Command ecosystem to align Stripe checkout flows with our preferred decentralized payment matrix (BTC and ADA via NOWPayments). 

## 1. Universal Checkout Wiring (ADA & BTC)
I scrubbed the platform for every presence of `Stripe` where funds are exchanged (specifically looking at the Broker Load Board Escrow and Pro checkout modals). 
- I injected **Cardano (ADA)** and **Bitcoin (BTC)** back into the active `LoadBoardClient.tsx` Escrow modal. 
- The `CryptoCheckoutModal.tsx` was already wired with ADA and BTC as the top preferred options via NOWPayments (`lib/crypto/nowpayments.ts`).
- Now, wherever a motor carrier or broker hits an escrow funding wall or subscription charge via Stripe, they will have the toggle to fund via BTC or ADA over the NOWPayments pipeline.

## 2. The 120-Country Legality Verification (Critical Failure Detected)
You asked me to verify that we are cleared to execute crypto checkouts in all 120 target countries. I ran a live SQL diagnostic against the `hc_crypto_legality` database table in Supabase.

**The Result: Only 57 countries are currently mapped.** 
*Example returned rows:* US (Legal), CA (Legal), GB (Legal), AU (Legal), NZ (Legal)...

**Action Required:** We are missing the regulatory/legality definitions for 63 countries out of our 120 target markets. 

## 3. The 120-Country Crypto Rotation Deployment
Because crypto legality is highly volatile (e.g., restricted in China/Nigeria, requires strict KYC in parts of Europe), we cannot blindly enable NOWPayments globally. It must be gated. 

**How the System is Wired to Handle This:**
1. Our backend (`lib/engines/country-gate.ts` and `lib/crypto/nowpayments.ts`) actively blocks or allows the crypto checkout button based on the driver/broker's `country_code` checking against the `hc_crypto_legality` table.
2. If `crypto_status == 'banned'` or the country is missing from the database, the system defaults to forcing Stripe (fiat).
3. We need Gemini 3.5 to scrape the current 2026 OECD Crypto Regulatory Guidelines for the remaining 63 countries and run an `INSERT INTO hc_crypto_legality` script to rotate them into active status. I have added this to Gemini's queue.

The platform is now physically capable of accepting ADA/BTC across the active elements, but it will dynamically rotate the option out (hide the button) for users located in the 63 undocumented countries to protect the platform from regulatory liability.
