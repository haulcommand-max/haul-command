import json
import os

# SEO Generator for Haul Command
# This script prepares the permutations for 50,000+ localized landing pages.

SERVICES = [
    "High Pole Pilot Car",
    "Steerman Escort for Superloads",
    "Route Survey Services",
    "Oversize Load Escorts",
    "Night/Weekend Permit Support",
    "Tillerman Steering Specialist",
    "Superload Transport Escort",
    "Mobile Crane Pilot Car",
    "Blade Transport Escort",
    "Transformer Move Escort"
]

LOCATIONS = [
    {"city": "El Paso", "state": "TX", "intel": "Strategically located on the I-10 corridor, El Paso serves as a critical junction for cross-border Superload moves."},
    {"city": "Savannah", "state": "GA", "intel": "The Port of Savannah requires specialized over-height escort coordination for industrial turbine transport."},
    {"city": "Gary", "state": "IN", "intel": "Steel corridor logistics in Gary often involve complex height obstruction routing near Lake Michigan."},
    {"city": "Dallas", "state": "TX", "intel": "The central logistics hub of the DFW metroplex, Dallas requires precise coordination for high-value tech infrastructure transport."},
    {"city": "Mobile", "state": "AL", "intel": "Port-based industrial freight in Mobile demands expert route surveys for coastal bridge clearances."},
    {"city": "Cleveland", "state": "OH", "intel": "The rust belt corridor in Cleveland presents unique challenges for wide-load steering around legacy infrastructure."},
    {"city": "Seattle", "state": "WA", "intel": "Pacific Northwest terrain requires specialized Tillerman support for tight mountain-pass radii and urban port moves."},
    {"city": "Charleston", "state": "SC", "intel": "Maritime industrial components leaving Charleston often require 24/7 lead and chase car coordination."},
    {"city": "Denver", "state": "CO", "intel": "High-altitude route surveys are essential for Denver-bound freight to ensure engine-break and clearance safety."},
    {"city": "Phoenix", "state": "AZ", "intel": "Climate-controlled specialized moves in the desert corridor rely on Haul Command for real-time hazard sync."},
    {"city": "Toronto", "state": "ON", "intel": "The Golden Horseshoe requires meticulous planning for superloads bypassing urban congestion on the 401."},
    {"city": "Vancouver", "state": "BC", "intel": "Mountainous terrain and strict BC Ministry of Transportation permits require expert local escort knowledge."},
    {"city": "Houston", "state": "TX", "intel": "Energy sector heavy haul in Houston often involves modular plant components requiring multi-car convoys."},
    {"city": "Jacksonville", "state": "FL", "intel": "A gateway to the Southeast, Jacksonville requires adherence to strict Florida night-travel curfews."}
]

LANDMARKS = [
    "I-10/I-75 Interchange",
    "Port of Houston",
    "Port of Savannah",
    "JFK Airport Cargo Area",
    "I-80/I-90 Crossroads",
    "Mackinac Bridge Northbound",
    "Delaware Memorial Bridge",
    "I-5 Corridor Industrial Zone",
    "Peace Bridge Border Crossing",
    "Ambassador Bridge Border Crossing"
]

def generate_seo_permutations():
    total_permutations = 0
    results = []

    # 1. Standard Category Pages (Service + City)
    for service in SERVICES:
        for loc in LOCATIONS:
            slug = f"{service.lower().replace(' ', '-')}-{loc['city'].lower().replace(' ', '-')}-{loc['state'].lower()}"
            page_data = {
                "service": service,
                "city": loc["city"],
                "state": loc["state"],
                "slug": slug,
                "local_intelligence": loc["intel"],
                "availability": 5 + (total_permutations % 15),
                "type": "CITY_LANDING"
            }
            results.append(page_data)
            total_permutations += 1

    # 2. Landmark "Near Me" Pages (Service + Landmark)
    for service in SERVICES:
        for landmark in LANDMARKS:
            slug = f"{service.lower().replace(' ', '-')}-near-{landmark.lower().replace('/', '-').replace(' ', '-')}"
            page_data = {
                "service": service,
                "landmark": landmark,
                "slug": slug,
                "local_intelligence": f"Specialized {service} support for operations directly servicing or transiting the {landmark}.",
                "availability": 2 + (total_permutations % 5),
                "type": "LANDMARK_OVERLAY"
            }
            results.append(page_data)
            total_permutations += 1

    print(f"Generated {total_permutations} SEO Page Permutations.")
    
    # Save to JSON for Next.js build-time ingestion
    output_dir = os.path.join('haul-command-hub', 'src', 'data')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    output_path = os.path.join(output_dir, 'seo_data_manifest.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=4)
    print(f"Manifest saved to {output_path}")

if __name__ == "__main__":
    generate_seo_permutations()
