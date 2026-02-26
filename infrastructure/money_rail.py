import json
import os
import datetime

class MoneyRail:
    """
    Implements Stream 8 (The Money Rail).
    Handles Factoring (3% fee), Fuel Advances (1% fee), and 1099 management.
    """
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.ledger_path = os.path.join(base_dir, "docs", "financial_ledger.json")

    def process_factoring_request(self, carrier_id, load_amount):
        """
        Takes a load amount and provides a 'Quick Pay' option with a 3% fee.
        """
        fee_rate = 0.03
        fee_amount = load_amount * fee_rate
        payout_amount = load_amount - fee_amount
        
        print(f"--- PROCESSING FACTORING: CARRIER {carrier_id} ---")
        print(f"Load Amount: ${load_amount}")
        print(f"Factoring Fee (3%): -${fee_amount}")
        print(f"TOTAL PAYOUT: ${payout_amount}")
        
        return {
            "carrier_id": carrier_id,
            "type": "FACTORING",
            "load_amount": load_amount,
            "fee": fee_amount,
            "net_payout": payout_amount,
            "timestamp": str(datetime.datetime.now())
        }

    def issue_fuel_advance(self, carrier_id, request_amount):
        """
        Issues a fuel advance with a 1% processing fee.
        """
        fee_rate = 0.01
        fee_amount = request_amount * fee_rate
        total_debt = request_amount + fee_amount
        
        print(f"\n--- ISSUING FUEL ADVANCE: CARRIER {carrier_id} ---")
        print(f"Advance Amount: ${request_amount}")
        print(f"Processing Fee (1%): +${fee_amount}")
        print(f"TOTAL DEBT TO BE DEDUCTED FROM LOAD: ${total_debt}")
        
        return {
            "carrier_id": carrier_id,
            "type": "FUEL_ADVANCE",
            "advance_amount": request_amount,
            "fee": fee_amount,
            "total_debt": total_debt,
            "timestamp": str(datetime.datetime.now())
        }

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    rail = MoneyRail(base_dir)
    
    # Simulate a load of $15,000 for a Heavy Haul
    load_factored = rail.process_factoring_request("CARRIER_77", 15000.0)
    
    # Simulate a fuel advance of $2,000
    fuel_adv = rail.issue_fuel_advance("CARRIER_77", 2000.0)
    
    # Save the transactions to the ledger
    os.makedirs(os.path.join(base_dir, "docs"), exist_ok=True)
    with open(rail.ledger_path, "w") as f:
        json.dump([load_factored, fuel_adv], f, indent=4)
    
    print(f"\nSUCCESS: Transactions logged to {rail.ledger_path}")
