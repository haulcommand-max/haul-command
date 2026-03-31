import os
import re

# Standard regex to find buttons and links without aria-labels
BUTTON_REGEX = re.compile(r'<button([^>]*?)>', re.IGNORECASE)
LINK_REGEX = re.compile(r'<Link([^>]*?)>', re.IGNORECASE)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    def button_repl(match):
        attrs = match.group(1)
        if 'aria-label=' not in attrs:
            # We add a generic aria-label, the user can refine them.
            return f'<button aria-label="Interactive Button"{attrs}>'
        return match.group(0)

    def link_repl(match):
        attrs = match.group(1)
        if 'aria-label=' not in attrs and ' href=' in attrs:
            return f'<Link aria-label="Navigation Link"{attrs}>'
        return match.group(0)

    new_content = BUTTON_REGEX.sub(button_repl, content)
    new_content = LINK_REGEX.sub(link_repl, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    target_dirs = ['components', 'app']
    root = os.getcwd()
    
    files_changed = 0

    for d in target_dirs:
        dir_path = os.path.join(root, d)
        if not os.path.exists(dir_path):
            continue
        for root_dir, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith('.tsx') or file.endswith('.jsx'):
                    filepath = os.path.join(root_dir, file)
                    if process_file(filepath):
                        files_changed += 1
                        print(f"Added aria-labels to: {filepath}")

    print(f"Total files updated with aria-labels: {files_changed}")

if __name__ == "__main__":
    main()
