import os
import sys
import json
import datetime

sys.path.append(r"c:\Users\PC User\Biz")

from wedge.regulatory_intelligence import RegulatoryIntelligenceEngine
from wedge.predictive_routing import PredictiveRoutingCore

class FeasibilityEngine:
    """
    THE WEDGE PRODUCT: AI Permit + Route Decision Engine.
    
    "Feasibility Before Freight Acceptance."
    
    Carrier enters dimensions ->
        AI predicts route viability ->
            Instant permit probability ->
                Risk score ->
                    Cost estimate.
    
    This becomes part of FREIGHT DECISION-MAKING, not paperwork.
    """
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.reg_engine = RegulatoryIntelligenceEngine(base_dir)
        self.routing_core = PredictiveRoutingCore(base_dir)
        self.decisions_log = os.path.join(base_dir, "data", "feasibility_decisions.json")
        os.makedirs(os.path.join(base_dir, "data"), exist_ok=True)

    def assess_feasibility(self, load_request):
        """
        THE CORE API. Takes a load request and returns a complete feasibility assessment.
        
        Input:
            load_request = {
                "shipper": str,
                "origin": str,
                "destination": str,
                "states_crossed": [str],       # State codes
                "dimensions": {height, width, length, weight},
                "candidate_routes": {name: [segments]},
                "equipment_type": str
            }
        
        Output:
            FeasibilityReport with permit probability, risk score, cost estimate,
            recommended route, and all regulatory requirements.
        """
        print("\n" + "=" * 60)
        print("  HAUL COMMAND AI PERMIT + ROUTE DECISION ENGINE")
        print("  'Feasibility Before Freight Acceptance'")
        print("=" * 60)
        
        dims = load_request["dimensions"]
        states = load_request["states_crossed"]
        candidates = load_request["candidate_routes"]
        
        # -------------------------------------------------------
        # LAYER 1: REGULATORY INTELLIGENCE (Multi-State Analysis)
        # -------------------------------------------------------
        print("\n[LAYER 1] Regulatory Intelligence Scan...")
        state_reports = {}
        total_permit_cost = 0.0
        total_processing_hours = 0
        escorts_needed = False
        law_enforcement_needed = False
        most_restrictive_state = None
        max_processing = 0
        
        for state in states:
            ptype, reqs = self.reg_engine.check_permit_required(state, dims)
            state_reports[state] = {"permit_type": ptype, "requirements": reqs}
            
            if "error" not in reqs:
                total_permit_cost += reqs.get("base_cost", 0)
                hours = reqs.get("est_processing_hours", 0)
                total_processing_hours += hours
                if hours > max_processing:
                    max_processing = hours
                    most_restrictive_state = state
                if reqs.get("escort_required"):
                    escorts_needed = True
                if reqs.get("law_enforcement_required"):
                    law_enforcement_needed = True
        
        # -------------------------------------------------------
        # LAYER 2: PREDICTIVE ROUTING (Multi-Route Scoring)
        # -------------------------------------------------------
        print("[LAYER 2] Predictive Routing Analysis...")
        scored_routes = self.routing_core.find_best_route(candidates, dims)
        
        best_route = scored_routes[0] if scored_routes else None
        any_viable = any(r["viable"] for r in scored_routes)
        
        # -------------------------------------------------------
        # FEASIBILITY DECISION LOGIC
        # -------------------------------------------------------
        print("[DECISION] Computing feasibility score...\n")
        
        # Permit probability: based on permit type complexity and route viability
        permit_prob = self._calculate_permit_probability(state_reports, best_route)
        
        # Risk score: composite of routing risk + regulatory complexity
        risk_score = self._calculate_risk_score(scored_routes, state_reports)
        
        # Cost estimate: permits + escorts + LE + fuel + overhead
        cost_estimate = self._calculate_cost_estimate(
            total_permit_cost, escorts_needed, law_enforcement_needed,
            len(states), dims
        )
        
        # -------------------------------------------------------
        # BUILD THE REPORT
        # -------------------------------------------------------
        report = {
            "timestamp": str(datetime.datetime.now()),
            "load_request": {
                "shipper": load_request["shipper"],
                "origin": load_request["origin"],
                "destination": load_request["destination"],
                "equipment": load_request["equipment_type"],
                "dimensions": dims,
            },
            "feasibility": {
                "permit_probability": f"{permit_prob}%",
                "risk_score": risk_score,
                "risk_grade": self._grade_risk(risk_score),
                "total_cost_estimate": f"${cost_estimate:,.2f}",
                "estimated_processing_time": f"{max_processing} hours (bottleneck: {most_restrictive_state})",
            },
            "regulatory": {
                "states_analyzed": len(states),
                "escort_required": escorts_needed,
                "law_enforcement_required": law_enforcement_needed,
                "total_permit_fees": f"${total_permit_cost:,.2f}",
                "state_details": state_reports,
            },
            "routing": {
                "routes_evaluated": len(scored_routes),
                "viable_routes_found": sum(1 for r in scored_routes if r["viable"]),
                "recommended_route": best_route["route_name"] if best_route else "NONE",
                "recommended_viable": best_route["viable"] if best_route else False,
                "route_details": scored_routes,
            },
            "decision": self._make_decision(permit_prob, risk_score, any_viable),
        }
        
        # Print the decision summary
        self._print_decision_summary(report)
        
        # Save the decision
        self._save_decision(report)
        
        return report

    def _calculate_permit_probability(self, state_reports, best_route):
        """Calculates the probability of permit approval based on regulatory and route data."""
        base_prob = 85  # Industry baseline: 70-75% auto-approval + our intelligence layer
        
        for state, data in state_reports.items():
            if data["permit_type"] == "SUPERLOAD":
                base_prob -= 15  # Superloads are harder
            elif data["permit_type"] == "UNKNOWN":
                base_prob -= 10
        
        if best_route and not best_route["viable"]:
            base_prob -= 20  # Route issues reduce probability
        
        if best_route and best_route["avg_risk"] > 0.5:
            base_prob -= int(best_route["avg_risk"] * 15)
        
        return max(min(base_prob, 99), 5)

    def _calculate_risk_score(self, scored_routes, state_reports):
        """Composite risk score from 0.0 (safe) to 1.0 (high risk)."""
        route_risk = scored_routes[0]["avg_risk"] if scored_routes else 0.5
        
        reg_complexity = 0.0
        for state, data in state_reports.items():
            if data["permit_type"] == "SUPERLOAD":
                reg_complexity += 0.3
            elif data["permit_type"] == "STANDARD":
                reg_complexity += 0.1
        reg_complexity = min(reg_complexity / max(len(state_reports), 1), 1.0)
        
        return round((route_risk * 0.6 + reg_complexity * 0.4), 3)

    def _calculate_cost_estimate(self, permit_fees, escorts, law_enforcement, num_states, dims):
        """Estimates total move cost including permits, escorts, LE, and overhead."""
        cost = permit_fees
        
        if escorts:
            # Estimate: $1.50/mile * ~800 miles avg + $500/day per escort vehicle
            cost += 1700 * num_states
        
        if law_enforcement:
            # Estimate: $85/hour * 10 hours avg per state
            cost += 850 * num_states
        
        # Fuel surcharge estimate based on weight
        weight = dims.get("weight", 80000)
        if weight > 150000:
            cost += 2500
        elif weight > 100000:
            cost += 1500
        
        # Platform fee (Haul Command revenue)
        cost += 150  # Base automation fee
        
        return cost

    def _grade_risk(self, risk_score):
        if risk_score <= 0.2: return "A (LOW RISK)"
        if risk_score <= 0.4: return "B (MODERATE)"
        if risk_score <= 0.6: return "C (ELEVATED)"
        if risk_score <= 0.8: return "D (HIGH RISK)"
        return "F (CRITICAL)"

    def _make_decision(self, permit_prob, risk_score, any_viable):
        if permit_prob >= 75 and risk_score <= 0.4 and any_viable:
            return "GO - HIGH CONFIDENCE. Accept freight."
        elif permit_prob >= 50 and risk_score <= 0.6:
            return "CONDITIONAL - Manual review recommended before acceptance."
        else:
            return "NO-GO - Risk too high. Consider alternative dimensions or routing."

    def _print_decision_summary(self, report):
        f = report["feasibility"]
        r = report["routing"]
        d = report["decision"]
        
        print("=" * 60)
        print("  FEASIBILITY REPORT")
        print("=" * 60)
        print(f"  Shipper:            {report['load_request']['shipper']}")
        print(f"  Route:              {report['load_request']['origin']} -> {report['load_request']['destination']}")
        print(f"  Equipment:          {report['load_request']['equipment']}")
        print(f"  Dimensions:         {report['load_request']['dimensions']}")
        print("-" * 60)
        print(f"  PERMIT PROBABILITY: {f['permit_probability']}")
        print(f"  RISK SCORE:         {f['risk_score']} ({f['risk_grade']})")
        print(f"  COST ESTIMATE:      {f['total_cost_estimate']}")
        print(f"  PROCESSING TIME:    {f['estimated_processing_time']}")
        print("-" * 60)
        print(f"  ROUTES EVALUATED:   {r['routes_evaluated']}")
        print(f"  VIABLE ROUTES:      {r['viable_routes_found']}")
        print(f"  RECOMMENDED:        {r['recommended_route']}")
        print("-" * 60)
        print(f"\n  >>> DECISION: {d}")
        print("=" * 60)

    def _save_decision(self, report):
        try:
            with open(self.decisions_log, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=4, default=str)
        except Exception:
            pass


# =====================================================
# DEMONSTRATION: Full Feasibility Assessment
# =====================================================
if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    engine = FeasibilityEngine(base_dir)
    
    # Scenario: Wind turbine nacelle from Houston, TX to Savannah, GA
    # Crosses TX, LA, GA
    load = {
        "shipper": "SIEMENS GAMESA RENEWABLES",
        "origin": "Port of Houston, TX",
        "destination": "Savannah, GA",
        "states_crossed": ["TX", "LA", "GA"],
        "dimensions": {
            "height": 14.2,
            "width": 13.8,
            "length": 95.0,
            "weight": 145000
        },
        "candidate_routes": {
            "Route A (I-10 Gulf Coast)": ["I-10 E (TX)", "I-10 E (LA)", "I-95 N (GA)"],
            "Route B (I-20 Northern)":   ["I-20 W (TX)", "I-20 W (LA)", "I-75 S (GA)"],
            "Route C (I-45 to I-16)":    ["I-45 S (TX)", "Hwy 59 (TX)", "I-16 E (GA)"],
        },
        "equipment_type": "9-Axle Specialized Lowboy"
    }
    
    result = engine.assess_feasibility(load)
