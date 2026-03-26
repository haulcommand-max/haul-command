# CLAUDE FRONT-END HANDOFF / REACT NATIVE iOS SPECS

Everything below the UI is definitively completed, hardened, and securely locked. The entire Haul Command "Backend-as-a-Service" logistics engine is live. It is now your job as the front-end agent to build the physical React Native iOS screens and the Retool-style internal Web Dashboards connecting to these arteries.

## 1. Directory Search API (Rate Limited / Geo-Locked)
**Endpoint:** `GET /api/directory/search`
*   **Purpose:** Takes standard query params (`?q=pilot+car&lat=...&lng=...`)
*   **Censorship Warning:** If the user is unauthenticated, the backend intentionally censors PII (Last Names, Phone Numbers) and injects poisoned honeypot traces.
*   **Your Task:** Build the `<DirectorySearchList />` in React Native. If `data.censored === true`, render an opaque blur over the phone numbers and display a large "Login to view all 1.5M Operators" modal.

## 2. Dispatch / Bidding Engine (Novu Push Push-Links)
**Endpoints:** `POST /api/dispatch/broadcast` and `POST /api/dispatch/bid`
*   **Purpose:** 
    *   `broadcast` allows an Escort Broker to ping all Pilot Cars within a specific origin state. The backend uses `@novu/node` to issue native iOS Push Notifications.
    *   `bid` allows the Pilot Car to reply with a dollar figure. 
*   **Your Task:** When building the React Native iOS app, you MUST integrate `@novu/notification-center` into the bottom tab navigator so the operators can instantly see dispatch alerts and quickly accept/bid on loads.

## 3. Stripe Escrow & Held Captures
**Endpoint:** `POST /api/escrow/accept-bid`
*   **Purpose:** Takes a Load ID and Bid ID. Pre-authorizes the Broker's credit card and HOLDS the money via `capture_method: 'manual'`.
*   **Your Task:** Build the `/dashboard/broker/loads` UI. When they click "Accept Bid", present the Stripe Elements input form. Do NOT present a "Payment" button—present an "Escrow Funds" button.

## 4. NOWPayments Crypto Payouts
**Endpoint:** `POST /api/treasury/nowpayments-withdraw`
*   **Purpose:** Auto-withdraws an Operator’s balance to their crypto wallet.
*   **Guardrails in Place:** The backend strictly rejects Ethereum (`ETH/ERC-20`) to prevent gas drain. The backend strictly requires a 3-Day (`T+3`) escrow settlement timeframe to prevent credit card chargebacks. 
*   **Your Task:** In the `<TreasuryWithdrawalForm />` UI, only allow users to select `USDC (Solana/Polygon)` or `USDT (Tron/BSC)`. Hardcode the UI label to warn them payouts take 3 business days to clear Escrow.

## 5. Defense Dashboard (Realtime)
**Endpoint:** Supabase `public.request_log` and `public.blocked_ips`
*   **Purpose:** The Vercel edge middleware automatically strips IP, ASN, and Lat/Lng telemetry from headers before logging it.
*   **Your Task:** Build the `/dashboard/defense` visual scatter map using generic SVG and D3. Listen to the Supabase Realtime WebSocket changes on `request_log` to plot the visual dots as requests slam the edge.

## 6. Route Intelligence AI (VAPI / Call Webhooks)
**Endpoint:** `POST /api/vapi/inbound`
*   **Your Task:** For the "AI Dispatcher" module in the mobile app, map the "Call Operator" button directly to the VAPI dialer system via the frontend SDK. Do NOT bypass the middle layer.

---

### Final Checklist for Front-End Execution:
[ ] Migrate `__tests__` over to mobile-first Jest suites.
[ ] Ensure `.env.local` possesses the correct `NEXT_PUBLIC_SUPABASE_URL` and `STRIPE_PUBLISHABLE_KEY` locally before starting compilation.
[ ] Vercel handles the backend cron jobs dynamically—do not attempt to replicate the cron logic inside React contexts.
