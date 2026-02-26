# State Spec Tips Database
## Jurisdiction-Specific Product Notes to Prevent Returns and Tickets

---

## How This Works

Every PDP (Product Detail Page) for signs, flags, beacons, and lighting displays
a "State Spec Tips" chip. When clicked, it shows jurisdiction-specific notes
relevant to that product category.

**This is NOT legal advice.** It's return prevention. The disclaimer:
> "Verify local rules; sizes/colors vary by jurisdiction. These notes are
> informational only and do not constitute legal advice."

---

## Official Industry Proof Links (The "Authority Rail")

These links serve as the "High-Gravity" proof points for the Decision Engine and FB Value Bombs.

| Authority | Resource Name | Verification Link |
|---|---|---|
| **FHWA** | National Pilot Car Best Practices | [FHWA Pilot Car Brochure](https://ops.fhwa.dot.gov/freight/sw/size_weight/pilotcar_brochure/pilotcar.pdf) |
| **Florida** | FDOT P/EVO Handbook | [Florida Pilot Escort Handbook](https://www.fdot.gov/docs/default-source/traffic/operations/manuals/pilot-escort-vehicle-operator-handbook.pdf) |
| **Georgia** | GDOT Escort Requirements | [Georgia Escort Rules](https://www.dot.ga.gov/PartnerSmart/truckpermits/GeorgiaEscortRequirements.pdf) |
| **Washington** | WSDOT Pilot/Escort Manual | [Washington PEVO Manual](https://wsdot.wa.gov/sites/default/files/2021-11/PilotEscortVehicleOperatorsManual.pdf) |
| **Minnesota** | MnDOT Sign Requirements | [Minnesota Signs & Flags PDF](https://www.dot.state.mn.us/cvo/oversizeweight/docs/signs-flags.pdf) |

---

## Universal Triggers (Most States)

| Dimension | Common Threshold | Note |
|---|---|---|
| Width | ≥ 12 ft | Requires "OVERSIZE LOAD" signage |
| Height | ≥ 14 ft 6 in | Often requires pole car / height measurement |
| Length | ≥ 90–100 ft | Escort requirements increase |
| Weight | Varies by state | Permit weight dictates route restrictions |

---

## Product Category: Signs & Banners

### "OVERSIZE LOAD" Signs

**Universal requirement:**
- Most states require signs on front AND rear of load
- Minimum size: typically 7 ft × 18 in (84" × 18")
- Letters: minimum 10" tall, black on yellow/orange background
- Must be removed or covered when not hauling oversize

**State-specific notes to display:**

| State | Spec Note |
|---|---|
| TX | "OVERSIZE LOAD" or "WIDE LOAD" accepted. Front + rear. Must be rigid or semi-rigid. |
| CA | Requires "OVERSIZED LOAD" (note the D). 7'×18" minimum. Reflective at night. |
| FL | "OVERSIZE LOAD" on front + rear. Fluorescent yellow-green or orange. |
| OH | "OVERSIZE" or "WIDE LOAD" depending on dimension exceeded. |
| PA | "OVERSIZE LOAD" required. Some routes require additional signage. |
| IL | Banner or rigid sign accepted. Must be visible from 500 ft. |
| NY | "OVERSIZE LOAD" front + rear. Must be illuminated at night. |
| GA | "WIDE LOAD" for width; "OVERSIZE LOAD" for multi-dimension. |
| IN | Front + rear signs required. Height loads may need additional pole signs. |
| Generic | "Most states require front + rear 'OVERSIZE LOAD' signs, 7'×18' minimum. Check your permit for specific requirements." |

**Mounting & Readability (The "Legal Shield"):**
- **MnDOT / FHWA Standard**: Signs must be **rigidly mounted**. 
- **Prohibited**: Draping over hoods, loose banners, wrinkled text, or obstructed views.
- **Placement**: Must be "clearly readable at all times" (FHWA). Banners must not be loose or wrinkled (MnDOT).
- **Penalties**: An escort violation is a permit violation. Both the pilot car and the truck can be cited for a single non-compliant banner.

---

## Product Category: Flags & Mounts

### Warning Flags (Red/Orange)

| State | Spec Note |
|---|---|
| Most | 18"×18" minimum, red or fluorescent orange |
| TX | Red or orange flags at each corner of oversize load + vehicle corners |
| CA | Red or fluorescent orange. Required on all four corners of projecting loads |
| FL | 18"×18" red or orange at widest points |
| Generic | "Red or orange flags (18\"×18\" minimum) required at load extremities. Number and placement vary by state — check your permit." |

### Flag Mounts
- Note: "Spring-loaded mounts recommended for highway speeds. Magnetic mounts may detach above 55 mph on some surfaces."

---

## Product Category: Lighting & Beacons

### Amber Beacons / Roof Strobes

| State | Spec Note |
|---|---|
| TX | Amber rotating/flashing required on escort vehicles. Visible 360° from 500 ft. |
| CA | Amber warning light required, visible from all directions. |
| FL | Amber rotating beacon required on escort vehicles at all times during escort. |
| OH | 360° amber light on escort vehicles. Some counties require additional. |
| Most | "Roof-mounted amber beacon required on escort vehicles. Must be visible 360° from 500 ft minimum. LED or rotating accepted in most states." |

### LED Light Bars
- Note: "Many states restrict specific colors (red/blue reserved for emergency). Amber + white only for escort vehicles in most jurisdictions."

---

## Product Category: High-Pole Kits

### Height Poles / Measurement Poles

| State | Spec Note |
|---|---|
| TX | Height pole required for loads exceeding 17 ft. Must extend to load height + 1 ft. |
| CA | Height pole required on front escort for height loads. |
| Most | "Height pole measures overhead clearance for tall loads. Required on lead escort vehicle when load height exceeds state threshold (typically 14'6\"–17')." |

### Rattler Poles (Specifically)
- Note: "Telescoping fiberglass construction. Ensure pole height rating exceeds your maximum load height. Tip must make audible contact with overhead obstructions."

---

## PDP Display Logic

```javascript
// Pseudocode for PDP spec tip display

function getSpecTips(product, shippingState) {
    const tips = [];

    // Universal tip for all physical products
    tips.push({
        type: 'general',
        text: 'Verify local rules; sizes/colors vary by jurisdiction.'
    });

    // Category-specific tips
    if (product.collection === 'Signs & Banners') {
        tips.push({
            type: 'spec',
            text: specTips.signs[shippingState] || specTips.signs['generic']
        });
    }

    if (product.collection === 'Flags & Mounts') {
        tips.push({
            type: 'spec',
            text: specTips.flags[shippingState] || specTips.flags['generic']
        });
    }

    if (product.collection === 'Lighting & Beacons') {
        tips.push({
            type: 'spec',
            text: specTips.beacons[shippingState] || specTips.beacons['generic']
        });
    }

    if (product.collection === 'High-Pole Kits & Parts') {
        tips.push({
            type: 'spec',
            text: specTips.poles[shippingState] || specTips.poles['generic']
        });
    }

    // Spec risk flag
    if (['Signs & Banners', 'Flags & Mounts', 'Lighting & Beacons',
         'High-Pole Kits & Parts'].includes(product.collection)) {
        tips.push({
            type: 'warning',
            text: 'SpecRisk: HIGH — This product type has jurisdiction-specific requirements.'
        });
    }

    // Pairing suggestions
    if (product.pairsWith) {
        tips.push({
            type: 'pair',
            text: `Pairs well with: ${product.pairsWith.join(', ')}`
        });
    }

    return tips;
}
```

---

## Auto-PDF Receipt Spec Tips Section

Every order receipt includes a "Spec Tips" block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SPEC TIPS FOR YOUR ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shipping to: [STATE]

⚠️ "OVERSIZE LOAD" Sign (SKU: HC-OS-SIGN-7X18)
   Your state ([STATE]) requires: [state-specific note]
   Standard: 7'×18", black on yellow/orange, front + rear.

🚩 Safety Flags × 4 (SKU: HC-FLAG-18RED)
   Mount at load extremities. 18"×18" minimum.
   [STATE]: [state-specific flag note]

🔶 Amber Beacon (SKU: HC-BEACON-LED360)
   Must be visible 360° from 500 ft.
   [STATE]: [state-specific beacon note]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCLAIMER: These notes are informational only
and do not constitute legal advice. Always verify
current regulations for your specific route and
jurisdiction before operating.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
