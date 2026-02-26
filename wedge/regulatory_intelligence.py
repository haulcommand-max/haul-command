import json
import os
import datetime

class RegulatoryIntelligenceEngine:
    """
    AI Stack Layer 1: The Compliance Brain.
    
    Centralized permit storage, renewal reminders, real-time application tracking,
    and integration with state/federal rules. This is the foundation that makes
    the Wedge Product possible.
    """
    
    # Multi-state regulatory database (seed data - 50 states will be populated)
    STATE_RULES = {
        "TX": {
            "max_width_no_permit": 8.5,  # feet
            "max_height_no_permit": 14.0,
            "max_length_no_permit": 59.0,
            "max_weight_no_permit": 80000,  # lbs
            "superload_threshold_weight": 254300,
            "superload_threshold_width": 20.0,
            "permit_portal": "TxDMV OSOW Online",
            "travel_restrictions": ["30 min before sunrise to 30 min after sunset", "No Sunday/Holiday travel for superloads"],
            "escort_required_width": 14.0,
            "law_enforcement_required_width": 16.0,
            "avg_processing_hours": 4,
            "annual_permit_available": True,
            "single_trip_cost_base": 60.00,
        },
        "GA": {
            "max_width_no_permit": 8.5,
            "max_height_no_permit": 13.5,
            "max_length_no_permit": 60.0,
            "max_weight_no_permit": 80000,
            "superload_threshold_weight": 200000,
            "superload_threshold_width": 18.0,
            "permit_portal": "GA OSOW Permit System",
            "travel_restrictions": ["Daylight only for loads > 12ft wide", "No holiday travel"],
            "escort_required_width": 12.0,
            "law_enforcement_required_width": 16.0,
            "avg_processing_hours": 8,
            "annual_permit_available": True,
            "single_trip_cost_base": 50.00,
        },
        "LA": {
            "max_width_no_permit": 8.5,
            "max_height_no_permit": 13.5,
            "max_length_no_permit": 59.5,
            "max_weight_no_permit": 80000,
            "superload_threshold_weight": 180000,
            "superload_threshold_width": 16.0,
            "permit_portal": "LA DOTD Permit Office",
            "travel_restrictions": ["Daylight only", "No travel during adverse weather warnings"],
            "escort_required_width": 12.0,
            "law_enforcement_required_width": 14.0,
            "avg_processing_hours": 12,
            "annual_permit_available": False,
            "single_trip_cost_base": 75.00,
        },
        "OK": {
            "max_width_no_permit": 8.5,
            "max_height_no_permit": 13.5,
            "max_length_no_permit": 65.0,
            "max_weight_no_permit": 80000,
            "superload_threshold_weight": 200000,
            "superload_threshold_width": 18.0,
            "permit_portal": "Oklahoma OSOW Online Portal",
            "travel_restrictions": ["Daylight only for superloads"],
            "escort_required_width": 12.0,
            "law_enforcement_required_width": 16.0,
            "avg_processing_hours": 6,
            "annual_permit_available": True,
            "single_trip_cost_base": 55.00,
        },
        "NM": {
            "max_width_no_permit": 8.5,
            "max_height_no_permit": 14.0,
            "max_length_no_permit": 65.0,
            "max_weight_no_permit": 86400,
            "superload_threshold_weight": 190000,
            "superload_threshold_width": 16.0,
            "permit_portal": "NM OSOW Portal",
            "travel_restrictions": ["Daylight only for loads > 14ft wide"],
            "escort_required_width": 12.0,
            "law_enforcement_required_width": 16.0,
            "avg_processing_hours": 8,
            "annual_permit_available": True,
            "single_trip_cost_base": 45.00,
        },
    }

    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.permit_store = os.path.join(base_dir, "data", "active_permits.json")
        self.compliance_log = os.path.join(base_dir, "data", "compliance_log.json")
        os.makedirs(os.path.join(base_dir, "data"), exist_ok=True)

    def get_state_rules(self, state_code):
        """Returns the regulatory profile for a given state."""
        rules = self.STATE_RULES.get(state_code.upper())
        if not rules:
            return None, f"State '{state_code}' not yet in regulatory database."
        return rules, None

    def check_permit_required(self, state_code, dimensions):
        """
        Determines if a permit is required and what type.
        Returns: permit_type (NONE, STANDARD, SUPERLOAD), requirements dict
        """
        rules, err = self.get_state_rules(state_code)
        if err:
            return "UNKNOWN", {"error": err}

        width = dimensions.get("width", 0)
        height = dimensions.get("height", 0)
        length = dimensions.get("length", 0)
        weight = dimensions.get("weight", 0)

        needs_permit = (
            width > rules["max_width_no_permit"] or
            height > rules["max_height_no_permit"] or
            length > rules["max_length_no_permit"] or
            weight > rules["max_weight_no_permit"]
        )

        if not needs_permit:
            return "NONE", {"message": "No permit required. Load is within legal limits."}

        is_superload = (
            weight >= rules["superload_threshold_weight"] or
            width >= rules["superload_threshold_width"]
        )

        requirements = {
            "escort_required": width >= rules["escort_required_width"],
            "law_enforcement_required": width >= rules["law_enforcement_required_width"],
            "travel_restrictions": rules["travel_restrictions"],
            "portal": rules["permit_portal"],
            "est_processing_hours": rules["avg_processing_hours"],
            "base_cost": rules["single_trip_cost_base"],
        }

        if is_superload:
            requirements["est_processing_hours"] = rules["avg_processing_hours"] * 3  # Superloads take longer
            requirements["base_cost"] = rules["single_trip_cost_base"] * 5  # And cost more
            return "SUPERLOAD", requirements

        return "STANDARD", requirements

    def check_renewal_alerts(self, permits):
        """Scans active permits for upcoming expirations."""
        alerts = []
        today = datetime.date.today()
        for p in permits:
            exp = datetime.date.fromisoformat(p.get("expiration", "2099-01-01"))
            days_left = (exp - today).days
            if days_left <= 30:
                alerts.append({
                    "permit_id": p["permit_id"],
                    "state": p["state"],
                    "days_remaining": days_left,
                    "urgency": "CRITICAL" if days_left <= 7 else "WARNING"
                })
        return alerts


if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    engine = RegulatoryIntelligenceEngine(base_dir)

    print("=" * 60)
    print("LAYER 1: REGULATORY INTELLIGENCE ENGINE")
    print("=" * 60)

    # Test across multiple states
    dims = {"width": 14.5, "height": 15.2, "length": 85.0, "weight": 165000}
    
    for state in ["TX", "GA", "LA", "OK", "NM"]:
        ptype, reqs = engine.check_permit_required(state, dims)
        print(f"\n--- {state} ---")
        print(f"  Permit Type: {ptype}")
        if "error" not in reqs:
            print(f"  Escort Required: {reqs.get('escort_required', 'N/A')}")
            print(f"  Law Enforcement: {reqs.get('law_enforcement_required', 'N/A')}")
            print(f"  Est. Processing: {reqs.get('est_processing_hours', 'N/A')} hours")
            print(f"  Base Cost: ${reqs.get('base_cost', 'N/A')}")
            print(f"  Portal: {reqs.get('portal', 'N/A')}")

    # Test renewal alerts
    print("\n\n--- RENEWAL ALERT CHECK ---")
    sample_permits = [
        {"permit_id": "TX-ANN-2025-001", "state": "TX", "expiration": "2026-02-20"},
        {"permit_id": "GA-TRIP-2025-044", "state": "GA", "expiration": "2026-03-15"},
        {"permit_id": "LA-TRIP-2025-099", "state": "LA", "expiration": "2026-02-14"},
    ]
    alerts = engine.check_renewal_alerts(sample_permits)
    for a in alerts:
        print(f"  ALERT [{a['urgency']}]: {a['permit_id']} ({a['state']}) - {a['days_remaining']} days remaining")
    if not alerts:
        print("  No urgent renewals.")
