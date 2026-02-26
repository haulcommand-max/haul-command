import os
import json

class StyleTrainer:
    """
    Analyzes input text samples to extract 'Voice DNA' for content generation.
    Based on Anik Singal's system and Jack Roberts' CEO Systems.
    """
    
    def __init__(self, samples_path):
        self.samples_path = samples_path
        self.voice_dna = {
            "tonality": "",
            "rhythm": "",
            "emoji_usage": "",
            "common_opening_hooks": [],
            "metaphor_themes": [],
            "formatting_rules": []
        }

    def analyze_samples(self):
        # In a real agentic setup, this would call an LLM to analyze the corpus.
        # For this implementation, we prepopulate with the 'Jack Roberts' DNA 
        # extracted from the provided source files.
        
        self.voice_dna = {
            "tonality": "High-energy, authoritative yet conversational, direct address ('Hey dude', 'Let\'s dive in').",
            "rhythm": "Short, punchy sentences mixed with deep pedagogical explanations. Use of 'Look,' as a transition.",
            "emoji_usage": "Strategic. Used for emphasis (🚀, ✅, 👉) rather than decoration.",
            "common_opening_hooks": [
                "Ever wish your [X] could [Y] instead of just [Z]?",
                "Look, most people think [Topic] is about [A]. They're completely wrong.",
                "I built and sold my last [Business] and now I run a [Scale] business."
            ],
            "metaphor_themes": ["Cockpits/Piloting", "Landscaping/Foundations", "Iron Man/Suits", "Jarvis/Co-pilots"],
            "formatting_rules": [
                "Use bolding for emphasis on key phrases.",
                "Frequent use of bullet points (MAPS, BLAST frameworks).",
                "End with a clear, high-value call to action."
            ]
        }
        return self.voice_dna

    def save_dna(self, output_path):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(self.voice_dna, f, indent=4)
        print(f"Voice DNA saved to {output_path}")

if __name__ == "__main__":
    base_dir = r"c:\Users\PC User\Biz"
    trainer = StyleTrainer(os.path.join(base_dir, "source_data"))
    trainer.analyze_samples()
    trainer.save_dna(os.path.join(base_dir, "config", "voice_dna.json"))
