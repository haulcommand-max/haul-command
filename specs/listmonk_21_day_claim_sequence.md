# Haul Command: Listmonk 21-Day Autonomous Claim Sequence
**Engine:** Listmonk (Self-Hosted canonical drip engine)
**Target:** Scraped Operators via `competitor_absorption_swarm`
**Trigger:** Supabase Webhook when `hc_global_operators.status = 'unclaimed'` AND email IS NOT NULL.

---

## The Automation Webhook
When the Scraper pushes an email to Supabase, Supabase fires this HTTP POST to Listmonk via `pg_net`:
```json
POST https://[YOUR_LISTMONK_URL]/api/subscribers
{
  "email": "{{new.email}}",
  "name": "{{new.business_name}}",
  "status": "enabled",
  "lists": [2], 
  "preconfirm_subscriptions": true
}
```
*(List ID 2 = "Pending Claim Loop"). Adding them to this list triggers the sequence below.*

---

## STAGE 1: Fast Authority (Day 0 - Sent Instantly)
**Subject:** Verify your business profile on Haul Command
**Behavioral Lens (Cole Gordon / Speed to Logic):** Get them to click immediately.

> Hey {{BusinessName}},
> 
> We noticed your profile on the Haul Command Directory is currently missing verified operation limits and trailing equipment data.
> 
> Brokers are currently restricted from sending you direct load requests because your profile is marked as 'Unverified'. 
> 
> **Click here to claim and verify your profile for free: [Claim_Link]**
> 
> Taking 30 seconds to confirm your DOT/MC or standard carrier authority will instantly list you as "Verified" on the active routing map. 
> 
> Stay safe,
> Haul Command Dispatch

---

## STAGE 2: Market Proof / FOMO (Day 3)
**Subject:** 4 loads matched your corridor (Unclaimed profile)
**Behavioral Lens (Billy Gene / Disruption):** Piss them off that someone else is getting their money.

> Hey {{BusinessName}},
> 
> You're missing out on dedicated freight. 
> 
> Over the last 72 hours, we've had multiple brokers querying the exact corridors you operate in, but we cannot route those loads to you.
> 
> Currently, unverified profiles are suppressed in the Load Intelligence map. Brokers are giving your freight to competitors who have simply taken the 30 seconds to claim their profile.
> 
> **[Claim your free directory listing now to intercept these loads]**
> 
> Best,
> Haul Command Capacity Team

---

## STAGE 3: The Free Leverage (Day 7)
**Subject:** Upgrading {{BusinessName}}'s directory rank
**Behavioral Lens (Alex Hormozi / Value Stacking):** Remove all risk and show massive free upside.

> {{BusinessName}},
> 
> Why are you paying to be listed on outdated boards?
> 
> Haul Command is the fastest-growing heavy haul operating system on earth. When you claim your profile, you don't just get listed—you get access to:
> - Real-time availability broadcasting (tell brokers you're empty)
> - Live corridor load intelligence
> - Verified trust badges that make brokers pick you first
> 
> It's 100% free to claim your profile. Keep your money and get more direct freight.
> 
> **[Claim Profile - 100% Free]**

---

## STAGE 4: The Takeaway / Ultimatum (Day 14)
**Subject:** Archiving the listing for {{BusinessName}}
**Behavioral Lens (Alex Becker / Software Leverage & Takeaway):**

> We are running a cleanup on dormant profiles in the Haul Command Directory to keep our broker data 100% accurate.
> 
> Since your profile has remained unclaimed since we discovered your operating authority, we will be marking your listing as "Inactive" in exactly 7 days. Once marked inactive, you will not receive direct routing matches.
> 
> If you are still operating trucks or pilot cars, claim the profile now before it is de-indexed.
> 
> **[Keep My Profile Active]**

---

## STAGE 5: The Final Prune (Day 21)
**Subject:** Your profile has been suppressed.
**Action:** Moves them out of the "Pending Claim Loop" list into a dormant graveyard list. 

> {{BusinessName}},
> 
> As mentioned last week, your directory profile has been suppressed from Live Routing searches.
> 
> If you wish to reactivate your listing in the future to receive loads, you can manually verify your authority here:
> 
> **[Reactivate My Fleet]**

---
*End Sequence. If they click ANY link and complete the form, the `competitor_absorption_swarm` API updates their Supabase status to `claimed`, which fires a webhook to remove them from Listmonk List 2 via DELETE.*
