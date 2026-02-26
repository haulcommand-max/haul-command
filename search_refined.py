import os

def main():
    directory = r"c:\Users\PC User\Biz\source_data"
    # User mentioned: "kill leaderboards", "Uber in the industry", "Phase 0", "Facebook group"
    keywords = ["Phase", "Zero", "Leader", "Board", "Uber", "Kill", "Facebook"]
    
    for filename in os.listdir(directory):
        if filename.endswith(".txt"):
            path = os.path.join(directory, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Focus on "Phase 0" and "Leaderboard"
                if ("phase" in content.lower() and ("0" in content.lower() or "zero" in content.lower())) or \
                   ("leader" in content.lower() and "board" in content.lower()) or \
                   ("uber" in content.lower()) or \
                   ("kill" in content.lower()):
                    
                    print(f"\n===== {filename} =====")
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        low_line = line.lower()
                        # Check for combinations
                        if (("phase" in low_line) and ("0" in low_line or "zero" in low_line)) or \
                           ("leader" in low_line and "board" in low_line) or \
                           ("uber" in low_line) or \
                           ("kill" in low_line):
                            
                            start = max(0, i - 5)
                            end = min(len(lines), i + 6)
                            print(f"\n--- Context (Line {i}) ---")
                            for j in range(start, end):
                                prefix = ">> " if j == i else "   "
                                print(f"{prefix}{lines[j]}")
                            print("-" * 30)

if __name__ == "__main__":
    main()
