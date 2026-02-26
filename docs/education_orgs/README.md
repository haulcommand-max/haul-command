# Escort & Pilot Car Education Organizations Directory

> Organizations that provide training, certification, and industry standards for the oversize/overweight transport escort industry.

---

## National Organizations

### Escort Service Certification (ESC)
- **Website:** [esc.org](https://www.esc.org)
- **Role:** Primary national certification body for pilot car operators
- **Certifications:** P/EVO (Pilot/Escort Vehicle Operator), Advanced Course
- **Coverage:** US nationwide + some Canadian recognition
- **Revenue Signal:** Certification marketplace, training referrals
- **HCOS Integration:** `escort_regulation.certification_provider`, `escort_regulation.certification_url`

### Specialized Carriers & Rigging Association (SC&RA)
- **Website:** [scranet.org](https://www.scranet.org)
- **Role:** Industry trade association for specialized transportation
- **Value:** Industry standards, conferences, networking, regulatory advocacy
- **Revenue Signal:** Event sponsorship, member directory, intelligence feed
- **HCOS Integration:** Market intelligence source

### Oversize/Overweight Load Management Alliance (OOLMA)
- **Website:** Research needed
- **Role:** Coalition for consistent permitting standards
- **Value:** Regulatory harmonization advocacy
- **Revenue Signal:** Policy intelligence, early regulatory change warnings

---

## State-Level Certification Programs

### States with Own Certification Requirements

| State | Program | Provider | Reciprocity |
|---|---|---|---|
| CA | CHP Escort Certification | California Highway Patrol | None |
| IL | Escort Vehicle Operator Course | IDOT | Limited |
| NY | Escort Driver Training | NYSDOT | Limited |
| PA | Escort Vehicle Operator | PennDOT | Limited |
| OH | Pilot Car Operator Training | ODOT | Limited |
| WA | Pilot Car Certification | WSDOT | OR, ID (partial) |

### States Accepting ESC National Certification

FL, GA, TX, WA, and 30+ additional states accept ESC P/EVO certification.
Full list tracked in `escort_regulation.certification_reciprocity`.

---

## Canadian Provincial Programs

| Province | Program | Provider | US Reciprocity |
|---|---|---|---|
| ON | Pilot Vehicle Operator Certification | Ontario MTO | None |
| AB | Pilot Vehicle Operator Certificate | Alberta Transportation | SK, MB, BC |
| BC | Pilot Car Operator | BC MOTI | AB (partial) |
| SK | Escort Vehicle Operator | SGI | AB, MB |
| MB | Pilot Vehicle Operator | Manitoba Infrastructure | AB, SK |

---

## Training Providers (Marketplace Opportunities)

### National Training Providers
| Provider | Delivery | States Covered | Opportunity |
|---|---|---|---|
| ESC (esc.org) | Online + In-Person | 50 states | Affiliate, referral |
| WITPAC | In-Person | Regional | Partnership, pipeline |
| Various state DOTs | In-Person | State-specific | Data source |

### Online Training Platforms
| Platform | Content | Opportunity |
|---|---|---|
| ESC Online Academy | P/EVO certification | White-label, affiliate |
| State DOT portals | State-specific requirements | Integration, compliance tracking |

---

## Industry Conferences & Events

| Event | Organizer | When | Value |
|---|---|---|---|
| SC&RA Annual Conference | SC&RA | Spring | Whale hunting, intelligence |
| Specialized Transportation Symposium | Various | Fall | Technical intelligence |
| CONEXPO-CON/AGG | AEM | Q1 (odd years) | Construction sector whales |
| OTC (Offshore Technology) | OTC | May | Energy sector whales |
| AWEA CLEANPOWER | ACP | Annual | Wind energy whales |

---

## Integration Points with HCOS

```
Education Org Data → escort_regulation table
  ├── certification_name
  ├── certification_provider
  ├── certification_url
  ├── certification_reciprocity
  └── reciprocity_states

Training Pipeline → Performance Darwinism
  ├── New escorts enter at base score
  ├── Training completion tracked
  ├── Performance scored from first job
  └── Top performers get whale accounts

Marketplace Opportunity
  ├── Training course affiliate revenue
  ├── Certification verification service
  ├── Equipment compliance bundles
  └── State-specific compliance packages
```
