import os
import json
from infrastructure.permit_routing_fabric import PermitRoutingFabric
from infrastructure.money_rail import MoneyRail
from infrastructure.demand_engine import DemandEngine

class HyperOSOrchestrator:
    """
    The Global "Brain" of Haul Command.
    Orchestrates independent revenue streams into a unified profit engine.
    """
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.permit_fabric = PermitRoutingFabric(base_dir)
        self.money_rail = MoneyRail(base_dir)
        self.demand_engine = DemandEngine(base_dir)

    def process_end_to_end_haul(self, shipper_id, carrier_id, load_details, vehicle_specs, route):
        print("\n=== HAUL COMMAND HYPER-OS: STARTING END-TO-END FLOW ===")
        
        # 1. PUBLISH LOAD (Stream 6)
        load = self.demand_engine.publish_load(
            shipper_id, 
            load_details['origin'], 
            load_details['destination'], 
            load_details['equipment'], 
            load_details['weight']
        )
        
        # 2. MATCH CARRIER (Stream 6 + Stream 15 Logic)
        matched = self.demand_engine.match_carrier(load['load_id'], carrier_id, 4.9)
        if not matched: return
        
        # 3. PERMIT & ROUTE FABRIC (Stream 4 & 5)
        permit_result = self.permit_fabric.submit_intelligent_permit(
            load_details['state'], 
            vehicle_specs, 
            route
        )
        if permit_result['status'] != 'ISSUED': return
        
        # 4. MONEY RAIL (Stream 8)
        payout = self.money_rail.process_factoring_request(carrier_id, load_details['rate'])
        
        print("\n=== HAUL COMMAND HYPER-OS: SUCCESSFUL LIFECYCLE ===")
        print(f"Node 6: Verified Load Published ({load['load_id']})")
        print(f"Node 4/5: Route Cleared & Permit Issued ({permit_result['permit_id']})")
        print(f"Node 8: Rapid Payout Processed (${payout['net_payout']})")
        
        return {
            "load": load,
            "permit": permit_result,
            "payout": payout
        }

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    orch = HyperOSOrchestrator(base_dir)
    
    # Example: A Transformer move from Dallas to Port of Houston
    load_details = {
        "origin": "Dallas, TX",
        "destination": "Port of Houston",
        "state": "Texas",
        "equipment": "12-Axle Trailer",
        "weight": 180000,
        "rate": 22000.0
    }
    specs = {"height": 13.5, "width": 14.0}
    route = ["I-45 S", "I-10 E"]
    
    orch.process_end_to_end_haul("ONCOR_ELEC", "ELITE_HEAVY_77", load_details, specs, route)
