import json
import os

class ContentRepurposer:
    """
    The BLAST Engine: Takes 1 Infrastructure Insight and makes 5 High-Authority formats.
    """
    
    def __init__(self, dna_path):
        with open(dna_path, "r") as f:
            self.dna = json.load(f)
            
    def generate_posts(self, category, insight):
        # We simulate the LLM generation using the extracted Voice DNA patterns
        posts = {
            "reach_hook": f"Look, most people think {category} is just about {insight.lower()}. They're completely wrong. 🚀",
            "engagement_insight": (
                f"I built and sold my last business by focusing on what actually moved the needle. "
                f"In the heavy-haul space, {category} isn't a cost—it's a leverage point.\n\n"
                f"Here are 3 ways we use {insight} to kill lead boards (Thread) 👇"
            ),
            "myth_buster": (
                f"Stop trusting the 'Standard' way of handling {category}. "
                f"The gatekeepers want you to keep paying wait fees for {insight}. "
                f"Here's the Haul Command alternative. ✅"
            ),
            "pov_script": (
                f"POV: You're watching your 16ft wide load pass a state trooper without a single paperwork delay "
                f"because you used our {category} OS. It feels like having a 500 IQ Jarvis in the cockpit. 🛩️"
            ),
            "cta": (
                f"We're rebuilding the entire logistics ecosystem from the ground up. "
                f"Join the Phase 0 group now to get the 'Uber-style' advantage before everyone else. 👉 [Link]"
            )
        }
        return posts

    def save_output(self, posts, filename):
        with open(filename, "w") as f:
            json.dump(posts, f, indent=4)
        print(f"Content generated and saved to {filename}")

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    dna_path = os.path.join(base_dir, "config", "voice_dna.json")
    repurposer = ContentRepurposer(dna_path)
    posts = repurposer.generate_posts("Permit Intelligence", "Automation engines and route verification")
    repurposer.save_output(posts, os.path.join(base_dir, "content_output.json"))
