import json
import os
import math

class PredictiveRoutingCore:
    """
    AI Stack Layer 2: The Predictive Routing Brain.

    Evaluates equipment attributes, load characteristics, jurisdiction rules,
    and route restrictions to identify the safest, most cost-effective route.
    ML layer (future) will train on historical permit approvals to predict outcomes.
    """

    # Simulated bridge/clearance database (would be populated from DOT data feeds)
    BRIDGE_DATABASE = {
        "I-10 E (TX)":      {"clearance_ft": 16.0, "weight_limit_lbs": 200000, "width_limit_ft": 18.0},
        "I-20 W (TX)":      {"clearance_ft": 14.8, "weight_limit_lbs": 180000, "width_limit_ft": 16.0},
        "I-45 S (TX)":      {"clearance_ft": 15.5, "weight_limit_lbs": 190000, "width_limit_ft": 16.0},
        "I-35 N (TX)":      {"clearance_ft": 15.0, "weight_limit_lbs": 170000, "width_limit_ft": 14.0},
        "Hwy 59 (TX)":      {"clearance_ft": 16.2, "weight_limit_lbs": 210000, "width_limit_ft": 18.0},
        "I-10 E (LA)":      {"clearance_ft": 15.0, "weight_limit_lbs": 160000, "width_limit_ft": 14.0},
        "I-20 W (LA)":      {"clearance_ft": 14.5, "weight_limit_lbs": 150000, "width_limit_ft": 14.0},
        "I-95 N (GA)":      {"clearance_ft": 14.6, "weight_limit_lbs": 170000, "width_limit_ft": 16.0},
        "I-16 E (GA)":      {"clearance_ft": 15.8, "weight_limit_lbs": 200000, "width_limit_ft": 18.0},
        "I-75 S (GA)":      {"clearance_ft": 15.2, "weight_limit_lbs": 185000, "width_limit_ft": 16.0},
        "I-40 W (OK)":      {"clearance_ft": 15.5, "weight_limit_lbs": 195000, "width_limit_ft": 16.0},
        "I-44 N (OK)":      {"clearance_ft": 14.8, "weight_limit_lbs": 175000, "width_limit_ft": 14.0},
        "I-25 S (NM)":      {"clearance_ft": 16.5, "weight_limit_lbs": 220000, "width_limit_ft": 18.0},
        "I-40 E (NM)":      {"clearance_ft": 15.8, "weight_limit_lbs": 200000, "width_limit_ft": 16.0},
    }

    # Known construction/restriction zones (real-time feed in production)
    RESTRICTION_ZONES = {
        "I-35 N (TX)": {"type": "CONSTRUCTION", "until": "2026-06-01", "detour": "Hwy 59 (TX)"},
        "I-20 W (LA)": {"type": "WEIGHT_RESTRICTION", "until": "2026-04-15", "max_weight_override": 120000},
    }

    def __init__(self, base_dir):
        self.base_dir = base_dir

    def evaluate_segment(self, segment_name, dimensions):
        """
        Evaluates a single route segment against the bridge/clearance database.
        Returns: (passable: bool, issues: list, risk_score: float)
        """
        bridge = self.BRIDGE_DATABASE.get(segment_name)
        if not bridge:
            # Unknown segment = moderate risk
            return True, [f"Segment '{segment_name}' not in bridge DB - manual verification recommended"], 0.5

        issues = []
        risk = 0.0

        # Height check
        margin_h = bridge["clearance_ft"] - dimensions.get("height", 0)
        if margin_h < 0:
            issues.append(f"HEIGHT FAIL: Load {dimensions['height']}ft vs bridge {bridge['clearance_ft']}ft")
            risk += 1.0
        elif margin_h < 1.0:
            issues.append(f"HEIGHT WARNING: Only {margin_h:.1f}ft clearance margin")
            risk += 0.4

        # Width check
        margin_w = bridge["width_limit_ft"] - dimensions.get("width", 0)
        if margin_w < 0:
            issues.append(f"WIDTH FAIL: Load {dimensions['width']}ft vs bridge limit {bridge['width_limit_ft']}ft")
            risk += 1.0
        elif margin_w < 2.0:
            issues.append(f"WIDTH WARNING: Only {margin_w:.1f}ft margin")
            risk += 0.3

        # Weight check
        if dimensions.get("weight", 0) > bridge["weight_limit_lbs"]:
            issues.append(f"WEIGHT FAIL: Load {dimensions['weight']}lbs vs bridge limit {bridge['weight_limit_lbs']}lbs")
            risk += 1.0

        # Restriction zone check
        restriction = self.RESTRICTION_ZONES.get(segment_name)
        if restriction:
            issues.append(f"ACTIVE RESTRICTION: {restriction['type']} until {restriction['until']}")
            if restriction.get("detour"):
                issues.append(f"  -> Suggested detour: {restriction['detour']}")
            risk += 0.6

        passable = risk < 1.0
        return passable, issues, min(risk, 1.0)

    def score_route(self, route_segments, dimensions):
        """
        Scores an entire route across multiple segments.
        Returns: (viable: bool, total_risk: float, segment_reports: list)
        """
        segment_reports = []
        total_risk = 0.0
        route_viable = True

        for seg in route_segments:
            passable, issues, risk = self.evaluate_segment(seg, dimensions)
            segment_reports.append({
                "segment": seg,
                "passable": passable,
                "risk_score": round(risk, 2),
                "issues": issues
            })
            total_risk += risk
            if not passable:
                route_viable = False

        # Normalize risk to 0-1 scale
        avg_risk = total_risk / max(len(route_segments), 1)
        
        return route_viable, round(avg_risk, 3), segment_reports

    def find_best_route(self, candidate_routes, dimensions):
        """
        Evaluates multiple candidate routes and returns the best one.
        This is where the ML layer will eventually train on historical data.
        """
        scored_routes = []
        for name, segments in candidate_routes.items():
            viable, risk, reports = self.score_route(segments, dimensions)
            scored_routes.append({
                "route_name": name,
                "viable": viable,
                "avg_risk": risk,
                "segments": reports
            })

        # Sort by viable first, then lowest risk
        scored_routes.sort(key=lambda r: (not r["viable"], r["avg_risk"]))
        return scored_routes


if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    router = PredictiveRoutingCore(base_dir)

    print("=" * 60)
    print("LAYER 2: PREDICTIVE ROUTING CORE")
    print("=" * 60)

    # A transformer load: 15.2ft tall, 14.5ft wide, 165,000 lbs
    dims = {"height": 15.2, "width": 14.5, "weight": 165000}

    # Define candidate routes from Houston to Atlanta
    candidates = {
        "Route A (I-10 -> I-95)": ["I-10 E (TX)", "I-10 E (LA)", "I-95 N (GA)"],
        "Route B (I-20 -> I-20 -> I-75)": ["I-20 W (TX)", "I-20 W (LA)", "I-75 S (GA)"],
        "Route C (I-45 -> I-20 -> I-16)": ["I-45 S (TX)", "I-20 W (TX)", "I-16 E (GA)"],
    }

    results = router.find_best_route(candidates, dims)

    for i, r in enumerate(results):
        marker = ">> RECOMMENDED" if i == 0 and r["viable"] else ""
        status = "VIABLE" if r["viable"] else "BLOCKED"
        print(f"\n{'='*40}")
        print(f"  {r['route_name']} [{status}] {marker}")
        print(f"  Avg Risk Score: {r['avg_risk']}")
        for seg in r["segments"]:
            seg_status = "OK" if seg["passable"] else "FAIL"
            print(f"    [{seg_status}] {seg['segment']} (risk: {seg['risk_score']})")
            for issue in seg["issues"]:
                print(f"         {issue}")
