import os
import json
from core.style_trainer import StyleTrainer
from core.repurposer import ContentRepurposer
from core.engagement_automator import EngagementAutomator

class HaulCommandHyperOS:
    """
    The Unified Orchestrator for Haul Command.
    Smashes the Authority Engine into a single automated pipeline.
    """
    
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.config_dir = os.path.join(base_dir, "config")
        self.dna_path = os.path.join(self.config_dir, "voice_dna.json")
        self.target_path = os.path.join(self.config_dir, "engagement_targets.json")
        self.output_path = os.path.join(base_dir, "content_output.json")
        
        # Ensure directories exist
        os.makedirs(self.config_dir, exist_ok=True)

    def run_full_growth_cycle(self, category, insight):
        print("--- LAUNCHING HAUL COMMAND HYPER-OS GROWTH CYCLE ---")
        
        # 1. STYLE TRAINING (Voice DNA)
        print("\nStep 1: Analyzing Voice DNA...")
        trainer = StyleTrainer(os.path.join(self.base_dir, "source_data"))
        trainer.analyze_samples()
        trainer.save_dna(self.dna_path)
        
        # 2. CONTENT REPURPOSING (The BLAST Engine)
        print("\nStep 2: Generating Multi-Platform Authority Content...")
        repurposer = ContentRepurposer(self.dna_path)
        posts = repurposer.generate_posts(category, insight)
        repurposer.save_output(posts, self.output_path)
        
        # 3. ENGAGEMENT AUTOMATION (The 30/30 Rule)
        print("\nStep 3: Triggering 30/30 Engagement Loop...")
        automator = EngagementAutomator(self.target_path)
        automator.run_engagement_loop("pre-post")
        
        print("\n--- GROWTH CYCLE COMPLETED SUCCESSFULLY ---")
        print(f"Final content available at: {self.output_path}")

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    os_engine = HaulCommandHyperOS(base_dir)
    
    # Executing on Node 9: Permit Intelligence
    os_engine.run_full_growth_cycle(
        "Node 9: Permit Intelligence", 
        "Automation engines and route verification"
    )
