import os
import json
import sys

# Dynamic path injection to ensure imports work from core/infrastructure
sys.path.append(os.path.join(r"c:\Users\PC User\Biz"))

from core.style_trainer import StyleTrainer
from core.repurposer import ContentRepurposer
from core.engagement_automator import EngagementAutomator
from infrastructure.permit_routing_fabric import PermitRoutingFabric
from infrastructure.money_rail import MoneyRail
from infrastructure.demand_engine import DemandEngine

class HaulCommandMegaOS:
    """
    The "Something Brand New".
    Smashes Authority (Growth) and Infrastructure (Operations) into a single dominant OS.
    """
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.config_dir = os.path.join(base_dir, "config")
        self.dna_path = os.path.join(self.config_dir, "voice_dna.json")
        self.target_path = os.path.join(self.config_dir, "engagement_targets.json")
        self.output_content = os.path.join(base_dir, "content_output.json")
        
        # Engines
        self.permit_fabric = PermitRoutingFabric(base_dir)
        self.money_rail = MoneyRail(base_dir)
        self.demand_engine = DemandEngine(base_dir)
        
        os.makedirs(self.config_dir, exist_ok=True)

    def execute_dominance_cycle(self, shipper_id, carrier_id, load_details, vehicle_specs, route):
        print("\n" + "="*50)
        print("LAUNCHING HAUL COMMAND MEGA-OS DOMINANCE CYCLE")
        print("="*50)
        
        # 1. INFRASTRUCTURE: Process the Operation
        print("\n[PHASE I: INFRASTRUCTURE OPS]")
        load = self.demand_engine.publish_load(
            shipper_id, 
            load_details['origin'], 
            load_details['destination'], 
            load_details['equipment'], 
            load_details['weight']
        )
        matched = self.demand_engine.match_carrier(load['load_id'], carrier_id, 4.9)
        permit = self.permit_fabric.submit_intelligent_permit(load_details['state'], vehicle_specs, route)
        payout = self.money_rail.process_factoring_request(carrier_id, load_details['rate'])
        
        # 2. AUTHORITY: Feed the Operation into the Growth Engine
        print("\n[PHASE II: AUTHORITY GROWTH]")
        # Extract Voice DNA
        trainer = StyleTrainer(os.path.join(self.base_dir, "source_data"))
        trainer.analyze_samples()
        trainer.save_dna(self.dna_path)
        
        # Repurpose the 'Node 9' success into viral content
        repurposer = ContentRepurposer(self.dna_path)
        insight = f"Successful {load_details['weight']}lb move via {permit['permit_id']} automated routing."
        posts = repurposer.generate_posts(f"Node 9: {load_details['state']} Infrastructure", insight)
        repurposer.save_output(posts, self.output_content)
        
        # Engagement loop
        automator = EngagementAutomator(self.target_path)
        automator.run_engagement_loop("post-success")
        
        print("\n" + "="*50)
        print("SUCCESS: 20-STREAM INFRASTRUCTURE FED INTO GROWTH ENGINE")
        print("="*50)
        print(f"Operational Success: {permit['permit_id']}")
        print(f"Financial Success: ${payout['net_payout']} Payout")
        print(f"Authority Success: Content generated at {self.output_content}")

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    mega_os = HaulCommandMegaOS(base_dir)
    
    # Execute Cycle
    load_info = {
        "origin": "Houston, TX",
        "destination": "Savannah, GA",
        "state": "Georgia",
        "equipment": "Super-B Train",
        "weight": 210000,
        "rate": 35000.0
    }
    specs = {"height": 14.5, "width": 16.0}
    route = ["I-10 E", "I-95 N"]
    
    mega_os.execute_dominance_cycle("GE_RENEWABLES", "MEGA_HAUL_1", load_info, specs, route)
