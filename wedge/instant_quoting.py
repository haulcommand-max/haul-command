import json
import os
import sys
import datetime

sys.path.append(r"c:\Users\PC User\Biz")

from wedge.regulatory_intelligence import RegulatoryIntelligenceEngine
from wedge.predictive_routing import PredictiveRoutingCore
from wedge.vehicle_profiles import VehicleProfileSystem

class InstantQuotingEngine:
    """
    Phase 1 Competitive Feature: Instant Quoting.
    
    What no competitor does:
    - Combines stored vehicle profiles + regulatory intelligence + route scoring
      into a SINGLE INSTANT QUOTE that a carrier can accept on the spot.
    
    The flow:
    1. Carrier selects vehicle from stored profile (1 click)
    2. Enters load weight + origin/destination (3 fields)
    3. Gets back: price, timeline, risk grade, recommended route
    4. Accepts or declines
    
    Total manual input: 4 fields.
    Legacy competitors: 15-25 fields + phone calls + fax.
    """
    
    # Pricing model (Haul Command's margin structure)
    PRICING = {
        "base_automation_fee": 49.00,       # Platform fee per permit
        "per_state_fee": 35.00,             # Per state crossed
        "superload_surcharge": 150.00,      # Additional for superloads
        "escort_coordination_fee": 75.00,   # If we arrange escorts
        "le_coordination_fee": 125.00,      # If we arrange law enforcement
        "rush_surcharge": 50.00,            # < 4 hour processing
        "route_analysis_fee": 25.00,        # Predictive route scoring
    }
    
    # Estimated costs we pass through (not our margin)
    PASSTHROUGH = {
        "escort_per_state_avg": 1200.00,
        "le_per_state_avg": 850.00,
    }
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.reg_engine = RegulatoryIntelligenceEngine(base_dir)
        self.routing_core = PredictiveRoutingCore(base_dir)
        self.profile_system = VehicleProfileSystem(base_dir)
        self.quotes_dir = os.path.join(base_dir, "data", "quotes")
        os.makedirs(self.quotes_dir, exist_ok=True)

    def generate_instant_quote(self, carrier_id, unit_number, load_weight,
                                origin, destination, states_crossed,
                                candidate_routes, rush=False):
        """
        THE MONEY MAKER. 
        4 inputs from the carrier. Full quote + feasibility in seconds.
        """
        # Step 1: Auto-fill from vehicle profile
        permit_req, err = self.profile_system.auto_fill_permit_request(
            carrier_id, unit_number, load_weight
        )
        if err:
            return None, err
        
        dims = permit_req["dimensions"]
        
        # Step 2: Multi-state regulatory scan
        state_analysis = {}
        for state in states_crossed:
            ptype, reqs = self.reg_engine.check_permit_required(state, dims)
            state_analysis[state] = {"permit_type": ptype, "requirements": reqs}
        
        # Step 3: Route scoring
        scored_routes = self.routing_core.find_best_route(candidate_routes, dims)
        best = scored_routes[0] if scored_routes else None
        any_viable = any(r["viable"] for r in scored_routes)
        
        # Step 4: Calculate pricing
        pricing = self._calculate_pricing(state_analysis, states_crossed, rush)
        
        # Step 5: Calculate permit probability
        permit_prob = self._calc_probability(state_analysis, best)
        
        # Step 6: Build the quote
        quote = {
            "quote_id": f"Q-{carrier_id}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
            "timestamp": str(datetime.datetime.now()),
            "carrier": carrier_id,
            "unit": unit_number,
            "vehicle_type": permit_req["vehicle_type"],
            "route": f"{origin} -> {destination}",
            "states": states_crossed,
            "load_dimensions": dims,
            "pricing": pricing,
            "feasibility": {
                "permit_probability": f"{permit_prob}%",
                "risk_grade": self._grade(best),
                "routes_evaluated": len(scored_routes),
                "viable_routes": sum(1 for r in scored_routes if r["viable"]),
                "recommended_route": best["route_name"] if best else "NONE",
            },
            "timeline": self._estimate_timeline(state_analysis, rush),
            "decision": "QUOTABLE" if permit_prob >= 50 and any_viable else "NEEDS REVIEW",
            "valid_for": "24 hours",
        }
        
        # Save quote
        quote_path = os.path.join(self.quotes_dir, f"{quote['quote_id']}.json")
        with open(quote_path, "w", encoding="utf-8") as f:
            json.dump(quote, f, indent=4, default=str)
        
        return quote, None

    def _calculate_pricing(self, state_analysis, states, rush):
        p = self.PRICING
        pt = self.PASSTHROUGH
        num_states = len(states)
        
        # Haul Command fees (our revenue)
        platform_fee = p["base_automation_fee"]
        state_fees = p["per_state_fee"] * num_states
        route_fee = p["route_analysis_fee"]
        
        superload_fee = 0
        escort_fee = 0
        le_fee = 0
        
        # Passthrough costs
        permit_costs = 0
        escort_costs = 0
        le_costs = 0
        
        escorts_needed = False
        le_needed = False
        
        for state, data in state_analysis.items():
            reqs = data["requirements"]
            if "error" in reqs:
                continue
            permit_costs += reqs.get("base_cost", 0)
            if data["permit_type"] == "SUPERLOAD":
                superload_fee += p["superload_surcharge"]
            if reqs.get("escort_required"):
                escorts_needed = True
                escort_fee += p["escort_coordination_fee"]
                escort_costs += pt["escort_per_state_avg"]
            if reqs.get("law_enforcement_required"):
                le_needed = True
                le_fee += p["le_coordination_fee"]
                le_costs += pt["le_per_state_avg"]
        
        rush_fee = p["rush_surcharge"] if rush else 0
        
        our_revenue = platform_fee + state_fees + route_fee + superload_fee + escort_fee + le_fee + rush_fee
        passthrough = permit_costs + escort_costs + le_costs
        total = our_revenue + passthrough
        
        return {
            "haul_command_fees": {
                "platform_fee": f"${platform_fee:.2f}",
                "per_state_fees": f"${state_fees:.2f} ({num_states} states)",
                "route_analysis": f"${route_fee:.2f}",
                "superload_surcharge": f"${superload_fee:.2f}" if superload_fee else None,
                "escort_coordination": f"${escort_fee:.2f}" if escort_fee else None,
                "le_coordination": f"${le_fee:.2f}" if le_fee else None,
                "rush_processing": f"${rush_fee:.2f}" if rush_fee else None,
                "subtotal": f"${our_revenue:.2f}",
            },
            "passthrough_costs": {
                "state_permit_fees": f"${permit_costs:.2f}",
                "escort_services": f"${escort_costs:.2f}" if escort_costs else None,
                "law_enforcement": f"${le_costs:.2f}" if le_costs else None,
                "subtotal": f"${passthrough:.2f}",
            },
            "total_quote": f"${total:.2f}",
            "haul_command_margin": f"${our_revenue:.2f}",
        }

    def _calc_probability(self, state_analysis, best_route):
        prob = 85
        for s, d in state_analysis.items():
            if d["permit_type"] == "SUPERLOAD":
                prob -= 15
        if best_route and not best_route["viable"]:
            prob -= 20
        return max(min(prob, 99), 5)

    def _grade(self, best):
        if not best: return "F"
        r = best["avg_risk"]
        if r <= 0.2: return "A (LOW RISK)"
        if r <= 0.4: return "B (MODERATE)"
        if r <= 0.6: return "C (ELEVATED)"
        if r <= 0.8: return "D (HIGH RISK)"
        return "F (CRITICAL)"

    def _estimate_timeline(self, state_analysis, rush):
        max_hours = 0
        bottleneck = "N/A"
        for state, data in state_analysis.items():
            reqs = data["requirements"]
            h = reqs.get("est_processing_hours", 0)
            if h > max_hours:
                max_hours = h
                bottleneck = state
        if rush:
            max_hours = max(2, max_hours // 2)
        return {
            "estimated_hours": max_hours,
            "bottleneck_state": bottleneck,
            "rush_available": max_hours > 4,
        }

    def print_quote(self, quote):
        """Pretty-prints a quote for carrier presentation."""
        p = quote["pricing"]
        f = quote["feasibility"]
        t = quote["timeline"]
        
        print("\n" + "=" * 60)
        print("  HAUL COMMAND - INSTANT QUOTE")
        print("=" * 60)
        print(f"  Quote ID:       {quote['quote_id']}")
        print(f"  Carrier:        {quote['carrier']}")
        print(f"  Vehicle:        {quote['vehicle_type']} (Unit: {quote['unit']})")
        print(f"  Route:          {quote['route']}")
        print(f"  States:         {', '.join(quote['states'])}")
        print(f"  Load:           {quote['load_dimensions']['width']}W x {quote['load_dimensions']['height']}H, {quote['load_dimensions']['weight']:,}lbs")
        print("-" * 60)
        print(f"  TOTAL QUOTE:    {p['total_quote']}")
        print(f"    Our Fees:     {p['haul_command_fees']['subtotal']}")
        print(f"    Passthrough:  {p['passthrough_costs']['subtotal']}")
        print("-" * 60)
        print(f"  PERMIT PROB:    {f['permit_probability']}")
        print(f"  RISK GRADE:     {f['risk_grade']}")
        print(f"  BEST ROUTE:     {f['recommended_route']}")
        print(f"  EST. TIME:      {t['estimated_hours']} hours (bottleneck: {t['bottleneck_state']})")
        print("-" * 60)
        print(f"  STATUS:         {quote['decision']}")
        print(f"  VALID FOR:      {quote['valid_for']}")
        print("=" * 60)


if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    quoter = InstantQuotingEngine(base_dir)
    
    print("=" * 60)
    print("INSTANT QUOTING ENGINE - Phase 1 Competitive Feature")
    print("=" * 60)
    
    # First, ensure vehicle profiles exist
    vps = VehicleProfileSystem(base_dir)
    profile = vps.get_profile("ELITE_HEAVY_77", "TRK-101")
    if not profile:
        print("Creating test vehicle profile...")
        vps.create_profile("ELITE_HEAVY_77", {
            "unit_number": "TRK-101",
            "type": "9-Axle Lowboy",
            "make": "Trail King",
            "year": 2022,
            "vin": "1TK9X4528NF123456",
            "plate": "TX-HEAVY-101",
            "plate_state": "TX",
            "dimensions": {"height": 12.8, "width": 8.5, "length": 53.0, "empty_weight": 42000},
            "axle_config": "9-axle",
            "max_payload": 180000,
            "insurance_expiry": "2026-03-01",
            "registration_expiry": "2026-08-01",
        })
    
    # THE DEMO: Carrier provides ONLY 4 things
    # 1. Unit number
    # 2. Load weight
    # 3. Origin/Destination
    # 4. That's it. Everything else is auto-filled.
    
    print("\n--- CARRIER INPUT (4 fields only) ---")
    print("  Unit: TRK-101")
    print("  Load weight: 140,000 lbs")
    print("  Origin: Dallas, TX")
    print("  Destination: Atlanta, GA")
    
    candidate_routes = {
        "Route A (I-20 Direct)": ["I-20 W (TX)", "I-20 W (LA)", "I-75 S (GA)"],
        "Route B (I-45 to I-10 to I-16)": ["I-45 S (TX)", "I-10 E (TX)", "I-16 E (GA)"],
        "Route C (I-35 to I-40)": ["I-35 N (TX)", "I-40 W (OK)", "I-75 S (GA)"],
    }
    
    quote, err = quoter.generate_instant_quote(
        carrier_id="ELITE_HEAVY_77",
        unit_number="TRK-101",
        load_weight=140000,
        origin="Dallas, TX",
        destination="Atlanta, GA",
        states_crossed=["TX", "LA", "GA"],
        candidate_routes=candidate_routes,
        rush=False,
    )
    
    if quote:
        quoter.print_quote(quote)
    else:
        print(f"ERROR: {err}")
