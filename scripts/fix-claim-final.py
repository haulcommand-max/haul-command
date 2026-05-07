import re

path = r'C:\Users\PC User\Biz\app\(landing)\_components\HomeClient.tsx'
src = open(path, encoding='utf-8').read()

# Fix 1: claim paragraph - the & is a literal & in the file
src = src.replace(
    'Join {displayCompanies}+ verified companies. Claim any alleged profile in under 60 seconds & instantly unlock discoverability, trust badges and conversion tools.',
    'Operators listed on Haul Command: {isStatsUnavailable ? "actively growing" : displayCompanies}. Claim your profile to unlock visibility, trust signals, and broker lead flow \u2014 free in under 60 seconds.'
)

# Fix 2: bullets
old_b = 'Instant verification available</span>'
new_b = 'Verification badge when eligibility confirmed</span>'
src = src.replace(old_b, new_b)

open(path, 'w', encoding='utf-8').write(src)

# Final verify
checks = [
    ('sentinel', 'totalOperators === -1'),
    ('GLOBAL_MARKETS', 'GLOBAL_MARKETS'),
    ('intent cards', 'Need coverage today'),
    ('QA fix', 'U.S. answers reference FMCSA'),
    ('claim language', 'Operators listed on Haul Command'),
    ('claim badge', 'Verification badge when eligibility'),
    ('market status', 'Live = active operators'),
    ('stats unavailable label', 'Operators Listed'),
]
src2 = open(path, encoding='utf-8').read()
all_ok = True
for name, needle in checks:
    status = "OK" if needle in src2 else "MISS"
    if status == "MISS":
        all_ok = False
    print(f"  [{status}] {name}")

print()
print("ALL PASS" if all_ok else "SOME MISSES - check above")
