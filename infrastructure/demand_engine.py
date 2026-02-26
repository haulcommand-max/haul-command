import json
import os

class DemandEngine:
    """
    Implements Stream 6 (The Demand Engine).
    Replaces lead boards with a centralized marketplace and reputation scoring.
    """
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.load_board = os.path.join(base_dir, "docs", "live_loads.json")

    def publish_load(self, shipper_id, origin, destination, equipment_needed, weight):
        """
        Publishes an oversized load to the Haul Command verified network.
        """
        load_data = {
            "load_id": f"LOAD-{shipper_id}-{origin[:3]}-{destination[:3]}",
            "shipper_id": shipper_id,
            "origin": origin,
            "destination": destination,
            "equipment": equipment_needed,
            "weight": weight,
            "status": "AVAILABLE"
        }
        
        print(f"--- PUBLISHING LOAD TO DEMAND ENGINE ---")
        print(f"Origin: {origin} | Destination: {destination}")
        print(f"Equipment: {equipment_needed}")
        
        return load_data

    def match_carrier(self, load_id, carrier_id, reputation_score):
        """
        Matches a carrier to a load based on reputation (Stream 15 reputation link).
        """
        if reputation_score < 4.5:
            print(f"MATCH REJECTED: Carrier {carrier_id} reputation ({reputation_score}) too low for this load.")
            return False
            
        print(f"MATCH SUCCESS: Carrier {carrier_id} matched to {load_id}")
        return True

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    engine = DemandEngine(base_dir)
    
    # Publish a wind turbine blade move
    load = engine.publish_load("SIEMENS_WIND", "Port of Houston", "Sweetwater, TX", "Blade Trailer", 110000)
    
    # Try to match a carrier
    engine.match_carrier(load["load_id"], "CARRIER_77", 4.8)
    
    # Save the load board
    os.makedirs(os.path.join(base_dir, "docs"), exist_ok=True)
    with open(engine.load_board, "w") as f:
        json.dump(load, f, indent=4)
