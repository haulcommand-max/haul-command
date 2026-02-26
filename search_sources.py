import os
import re

def main():
    directory = r"c:\Users\PC User\Biz\source_data"
    keywords = ["Phase 0", "leaderboard", "Uber in the", "Facebook group", "marketing network"]
    
    for filename in os.listdir(directory):
        if filename.endswith(".txt"):
            path = os.path.join(directory, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = []
                for kw in keywords:
                    if kw.lower() in content.lower():
                        matches.append(kw)
                
                if matches:
                    print(f"\n--- MATCHES IN {filename}: {matches} ---\n")
                    # Print context for each match
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        for kw in matches:
                            if kw.lower() in line.lower():
                                start = max(0, i - 2)
                                end = min(len(lines), i + 3)
                                print(f"Context (L{i}):")
                                for context_line in lines[start:end]:
                                    print(f"  {context_line}")
                                print("-" * 20)

if __name__ == "__main__":
    main()
