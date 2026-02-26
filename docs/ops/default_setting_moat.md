# 🏰 The Default Setting Moat
> **Strategy**: "Translating Loss into Lock-in."
> **Core Concept**: If a user leaves the platform, they must feel they are physically losing money/safety.

---

## 1. The Loss Meters (Visible Pain)

These meters are displayed on the Dashboard to quantify the cost of *not* using Haul Command.

| Loss Meter | Data Source | Calculation Logic |
| :--- | :--- | :--- |
| **Deadhead Leak** | `analytics_events` (location) | `(Total Miles - Paid Miles) * $1.85` |
| **Curfew Risk** | `jurisdiction_rules` (curfew) | `IF current_time + 2hr > curfew_start THEN Risk = High` |
| **Late Pay Risk** | `payment_profiles` (velocity) | `Average Days to Pay (Broker) - 30 Days` |
| **Compliance Gap** | `verification_docs` (expiry) | `Count(Expired Certs) / Total Required Certs` |
| **Evidence Gap** | `reputation_events` (logs) | `100% - (Verified Logs / Total Jobs)` |

---

## 2. Daily Check Reasons (The "Hook")

Why does a user open the app *every single day* even without a job?

1.  **Earnings Tracker**: "projected_income" vs "actual_received".
2.  **Wind Alerts**: "High Wind Warning" for their specific saved corridor.
3.  **Rival Tracking**: "3 Pilots in your area just ranked up." (Gamification).
4.  **Available Pulse**: "Confirm you are ready" to boost visibility.
5.  **Broker Watchlist**: "Broker X just paid 3 invoices in 24 hours."

---

## 3. Irreversible Lock-In (The "Moat")

These assets are owned by the user but *hosted* by Haul Command. Moving platforms means losing the asset.

1.  **Verified Travel Ledger**: A breakdown of every mile driven, verified by GPS. (Used for tax audits).
2.  **Reputation Graph**: The "5-Star" score that actually means something because it's tied to `compliance_pass` events.
3.  **Evidence Vault**: The photo chain of custody that protects against insurance claims.
4.  **Network Status**: The "Verified" badge that took 6 months to earn.

---

## 4. The MVP Moat Set (Minimum Viable Lock-in)

We do not launch until these 4 engines are active:

1.  **Verified Identity**: You are who you say you are.
2.  **Compliance Gate**: You cannot accept a job you are illegal for.
3.  **Payment Hold**: You get paid if you do the job description.
4.  **Evidence Snapshots**: You have proof you did it.
