# DIESEL BLOOD USA
## Heavy Haul Directory — 57-Country Regulation Framework
### Master Gemini Research Prompt Document
_Based on Florida FAC 14-26 Pilot/Escort Flagging Training as Universal Template_

---

## SECTION 1 — HOW TO USE THIS DOCUMENT WITH GEMINI

This document is your master research prompt for building the Diesel Blood USA global heavy haul directory. Florida Administrative Code (FAC) 14-26 from the Florida Pilot/Escort Flagging Training workbook serves as the universal structural template. Every country in the world that moves oversized/overweight loads uses some version of the same categories — escort qualifications, vehicle requirements, load dimension limits, travel restrictions, flagging procedures, and permits. The numbers and rules differ, but the structure is identical.

### HOW TO FEED THIS TO GEMINI:
*   Copy **Section 3** (the per-country template) into Gemini along with your request
*   Tell Gemini: *"Using Florida FAC 14-26 as the structural template, research and fill in the equivalent rules for [COUNTRY NAME]. Use official government sources only. For any field where no official data exists, write NOT FOUND and give a confidence score of 1."*
*   Gemini will fill in the table row by row, citing sources
*   For countries with low confidence scores (1-2), flag them in the app directory as 'Regulation data limited — verify locally'
*   Run this process for all 57 countries in Section 2
*   Feed the completed data into your Supabase `country_regulations` table

**IMPORTANT:** For autonomous vehicle fields at the bottom of the template, prompt Gemini separately: *"Search for current AV freight corridor regulations and designated testing zones in [COUNTRY]. Include any government agency that governs autonomous trucking."*

---

## SECTION 2 — ALL 57 COUNTRIES (Feed each through Gemini one at a time)

Run the research template in Section 3 for each of these countries. Countries are grouped by region. Note the measurement system — Gemini must convert all dimensions to match that country's standard units (metric vs imperial).

| Country | Code | Region | System | Currency |
| :--- | :--- | :--- | :--- | :--- |
| USA | US | North America | Imperial | USD |
| Canada | CA | North America | Metric | CAD |
| Mexico | MX | North America | Metric | MXN |
| United Kingdom | GB | Europe | Metric/Imperial | GBP |
| Germany | DE | Europe | Metric | EUR |
| France | FR | Europe | Metric | EUR |
| Spain | ES | Europe | Metric | EUR |
| Italy | IT | Europe | Metric | EUR |
| Portugal | PT | Europe | Metric | EUR |
| Netherlands | NL | Europe | Metric | EUR |
| Belgium | BE | Europe | Metric | EUR |
| Sweden | SE | Europe | Metric | SEK |
| Norway | NO | Europe | Metric | NOK |
| Denmark | DK | Europe | Metric | DKK |
| Finland | FI | Europe | Metric | EUR |
| Switzerland | CH | Europe | Metric | CHF |
| Austria | AT | Europe | Metric | EUR |
| Poland | PL | Europe | Metric | PLN |
| Czech Republic | CZ | Europe | Metric | CZK |
| Hungary | HU | Europe | Metric | HUF |
| Romania | RO | Europe | Metric | RON |
| Greece | GR | Europe | Metric | EUR |
| Turkey | TR | Europe/Asia | Metric | TRY |
| UAE | AE | Middle East | Metric | AED |
| Saudi Arabia | SA | Middle East | Metric | SAR |
| Israel | IL | Middle East | Metric | ILS |
| India | IN | Asia | Metric | INR |
| China | CN | Asia | Metric | CNY |
| Japan | JP | Asia | Metric | JPY |
| South Korea | KR | Asia | Metric | KRW |
| Pakistan | PK | Asia | Metric | PKR |
| Bangladesh | BD | Asia | Metric | BDT |
| Indonesia | ID | Asia | Metric | IDR |
| Vietnam | VN | Asia | Metric | VND |
| Thailand | TH | Asia | Metric | THB |
| Malaysia | MY | Asia | Metric | MYR |
| Philippines | PH | Asia | Metric | PHP |
| Singapore | SG | Asia | Metric | SGD |
| Australia | AU | Oceania | Metric | AUD |
| New Zealand | NZ | Oceania | Metric | NZD |
| Brazil | BR | South America | Metric | BRL |
| Argentina | AR | South America | Metric | ARS |
| Chile | CL | South America | Metric | CLP |
| Colombia | CO | South America | Metric | COP |
| Peru | PE | South America | Metric | PEN |
| South Africa | ZA | Africa | Metric | ZAR |
| Nigeria | NG | Africa | Metric | NGN |
| Kenya | KE | Africa | Metric | KES |
| Egypt | EG | Africa | Metric | EGP |
| Ghana | GH | Africa | Metric | GHS |
| Tanzania | TZ | Africa | Metric | TZS |
| Ethiopia | ET | Africa | Metric | ETB |
| Morocco | MA | Africa | Metric | MAD |
| Algeria | DZ | Africa | Metric | DZD |
| Tunisia | TN | Africa | Metric | TND |
| Angola | AO | Africa | Metric | AOA |
| Mozambique | MZ | Africa | Metric | MZN |

### CONFIDENCE TIER GUIDE FOR GEMINI OUTPUT:
*   **Score 5** — Official government regulation document found and verified (e.g. FDOT, UK DVSA, German Federal Ministry)
*   **Score 4** — Official government website found, regulation inferred from published guidelines
*   **Score 3** — Credible industry association data found (e.g. SC&RA equivalent, national trucking federation)
*   **Score 2** — Unofficial but widely cited industry source, no official document found
*   **Score 1** — No reliable data found. Mark in app as: *Regulation data not verified — consult local authority*

---

## SECTION 3 — PER-COUNTRY REGULATION RESEARCH TEMPLATE

> **GEMINI PROMPT TO USE:**
> You are a heavy haul transportation regulation researcher. Using official government and regulatory sources only, research oversize/overweight vehicle transport rules for **[COUNTRY]**. Fill in column 2 of the table below using Florida FAC 14-26 as the structural guide. For each field: write the **[COUNTRY]** equivalent rule with the official measurement units. If a field does not exist in **[COUNTRY]** regulations, write NOT APPLICABLE. If you cannot find reliable official data, write NOT FOUND. For column 3, cite your source URL and give a confidence score 1-5 (5=official government document, 1=no data found). Also research whether **[COUNTRY]** has any designated autonomous vehicle freight corridors or AV regulation bodies.

| Category (from Florida FAC 14-26) | [COUNTRY] Equivalent Rule | Source / Confidence |
| :--- | :--- | :--- |
| Escort Qualification — Minimum Age | [Research required] Florida = 18 years | FILL IN |
| Escort Qualification — License Required | [Research required] Florida = valid driver license | FILL IN |
| Escort Qualification — Training Course | [Research required] Florida = 8-hour pilot/escort flagging course | FILL IN |
| Escort Qualification — Renewal Period | [Research required] Florida = every 4 years | FILL IN |
| Escort Vehicle — Min Weight (GVWR) | [Research required] Florida = 2,000 lbs | FILL IN |
| Escort Vehicle — Max Weight (GVWR) | [Research required] Florida = 25,999 lbs | FILL IN |
| Escort Vehicle — Warning Light Color | [Research required] Florida = Amber | FILL IN |
| Escort Vehicle — Warning Light Class | [Research required] Florida = Class 2 | FILL IN |
| Escort Vehicle — Flag Size | [Research required] Florida = 18 x 18 inches | FILL IN |
| Escort Vehicle — Flag Color | [Research required] Florida = Red or fluorescent orange | FILL IN |
| Escort Vehicle — Flag Angle | [Research required] Florida = 40-70 degrees from roof | FILL IN |
| On-Board — Fire Extinguisher | [Research required] Florida = Class ABC, min 5 lbs | FILL IN |
| On-Board — Traffic Cones | [Research required] Florida = Three 36-inch cones | FILL IN |
| On-Board — Height Pole Required Above | [Research required] Florida = loads over 14 ft 6 in | FILL IN |
| On-Board — Height Pole Clearance | [Research required] Florida = 6 inches above load | FILL IN |
| Load Dimensions — Standard Max Width | [Research required] Florida = 8 ft 6 in | FILL IN |
| Load Dimensions — Max Width (1 escort) | [Research required] Florida = 12 ft | FILL IN |
| Load Dimensions — Max Width (2 escorts) | [Research required] Florida = 14 ft | FILL IN |
| Load Dimensions — LE Escort Required Width | [Research required] Florida = over 16 ft | FILL IN |
| Load Dimensions — Standard Max Height | [Research required] Florida = 13 ft 6 in | FILL IN |
| Load Dimensions — Max Height (1 escort) | [Research required] Florida = 14 ft 6 in | FILL IN |
| Load Dimensions — Standard Max Length | [Research required] Florida = 65 ft | FILL IN |
| Load Dimensions — Max Length (1 escort) | [Research required] Florida = 95 ft | FILL IN |
| Load Dimensions — Max Length (2 escorts) | [Research required] Florida = 150 ft | FILL IN |
| Load Dimensions — LE Escort Required Length | [Research required] Florida = over 250 ft | FILL IN |
| Travel Restrictions — Daytime Only? | [Research required] Florida = Yes, 1/2 hr before sunrise to 1/2 hr after sunset | FILL IN |
| Travel Restrictions — Holiday Restrictions? | [Research required] Florida = Yes, New Year / Memorial / Independence / Labor / Thanksgiving / Christmas | FILL IN |
| Travel Restrictions — Visibility Minimum | [Research required] Florida = 1,000 feet | FILL IN |
| Travel Restrictions — Weekend Movement? | [Research required] Florida = Prohibited unless permit states otherwise | FILL IN |
| Survey Letter Required Width | [Research required] Florida = over 16 ft wide | FILL IN |
| Survey Letter Required Height | [Research required] Florida = over 15 ft tall | FILL IN |
| Survey Letter Clearance — Height | [Research required] Florida = 6 inches above load | FILL IN |
| Survey Letter Clearance — Width Each Side | [Research required] Florida = 2 feet each side | FILL IN |
| Rail Crossing — Advance Contact Required | [Research required] Florida = Yes, under 9 inches clearance | FILL IN |
| Permit Office — Name | [Research required] | FILL IN |
| Permit Office — Phone | [Research required] | FILL IN |
| Permit Office — Website | [Research required] | FILL IN |
| Permit Office — Online Application? | [Research required] | FILL IN |
| Apparel — Required Type | [Research required] Florida = High visibility, fluorescent, Class 2 vest | FILL IN |
| Apparel — Night Upgrade | [Research required] Florida = Class 3 vest at night | FILL IN |
| Flagging — Authorized Tool (Paddle) | [Research required] Florida = STOP/SLOW paddle, 18 inch diameter, 6 inch letters | FILL IN |
| Flagging — Authorized Tool (Flag) | [Research required] Florida = Red or fluorescent orange, 12 x 12 inches | FILL IN |
| Flagging Authorization — Statute | [Research required] Florida = Statute 316.079(2) | FILL IN |
| Warning Signs — Oversize Load Banner Text | [Research required] Florida = Black letters on yellow background | FILL IN |
| Warning Signs — Minimum Banner Size | [Research required] Florida = 7 ft x 18 inches, 12 inch letters | FILL IN |
| Autonomous Vehicle (AV) Corridors? | [Research required] Are there designated AV freight corridors in this country? | FILL IN |
| AV Regulatory Body | [Research required] Which agency governs autonomous freight in this country? | FILL IN |
| Measurement System for All Above |  |  |
| Data Confidence Score (1-5) | 1=No data available, 3=Partial, 5=Fully verified official source | FILL IN |

---

## SECTION 4 — APP INTEGRATION NOTES

### Permit Checker Tool
*   Query `country_regulations` WHERE `country_code` = selected country
*   Display `permit_office_name`, `permit_office_phone`, `permit_office_website`
*   Show load dimension limits with user's load dimensions highlighted
*   Flag if `data_confidence_score < 3` with warning: Verify with local authority

### Escort Requirement Finder
*   User inputs: country, load width, load height, load length
*   Query returns: number of escorts required, whether law enforcement escort is mandatory
*   Show applicable travel time restrictions and holiday list

### Autonomous Vehicle Corridor Monitor
*   Filter WHERE `av_corridors_exist = TRUE`
*   Display `av_regulatory_body` and `av_corridor_notes`
*   Feed into AV Route Monitor map overlay (Section 5 of master dev prompt)

### Directory Confidence Badge
*   **Score 5:** Green badge — Verified official data
*   **Score 3-4:** Yellow badge — Industry verified
*   **Score 1-2:** Red badge — Unverified — contact local authority

### SEO Page Generation (per country)
*   URL pattern: `/directory/[country-slug]/regulations/`
*   H1: Heavy Haul Regulations in `[Country]` — Pilot Cars, Brokers & Permits
*   Meta description: Find oversize load rules, escort requirements, and permit offices in `[Country]`. Updated directory powered by Diesel Blood USA.
*   OG image: Gemini-generated banner at 1200x630px — prompt: "Heavy haul trucking `[Country]`, wide highway, golden hour, professional"

_Diesel Blood USA — Confidential Internal Document — Not for Distribution_
