import os

def main():
    directory = r"c:\Users\PC User\Biz\source_data"
    keywords = ["Phase 0", "leaderboard", "Uber", "killing"]
    
    for filename in os.listdir(directory):
        if filename.endswith(".txt"):
            path = os.path.join(directory, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if any(kw.lower() in content.lower() for kw in keywords):
                    print(f"\n===== {filename} =====")
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if any(kw.lower() in line.lower() for kw in keywords):
                            start = max(0, i - 10)
                            end = min(len(lines), i + 10)
                            print(f"\n--- Context (Line {i}) ---")
                            for j in range(start, end):
                                prefix = ">> " if j == i else "   "
                                print(f"{prefix}{lines[j]}")
                            print("-" * 30)

if __name__ == "__main__":
    main()
