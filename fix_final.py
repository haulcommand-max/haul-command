import re
import sys

def fix_file(filename, replacements):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)

    if content != original:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filename}")

fix_file('app/admin/trust/page.tsx', [
    (r'title: ".*Fraud Detection Scan",', 'title: "🔍 Fraud Detection Scan",'),
    (r'desc: "Scan reviews for fraud signals\. Auto-holds .*0\.85 probability\. Shadowbans .*0\.65\.",', 'desc: "Scan reviews for fraud signals. Auto-holds ≥0.85 probability. Shadowbans ≥0.65.",')
])

fix_file('app/emergency/nearby/page.tsx', [
    (r'\{locating \? "Locating\.\.\." : ".*Use my location"\}', '{locating ? "Locating..." : "📍 Use my location"}')
])
