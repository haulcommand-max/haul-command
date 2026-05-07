path = r'C:\Users\PC User\Biz\app\(landing)\_components\HomeClient.tsx'
src = open(path, encoding='utf-8').read()

# Fix claim section trust language (JSX entities in file)
src = src.replace(
    'Join {displayCompanies}+ verified companies. Claim any alleged profile in under 60 seconds &amp; instantly unlock discoverability, trust badges and conversion tools.',
    '{isStatsUnavailable ? "Thousands of" : `${displayCompanies}`} operators are listed on Haul Command. Claim your profile to unlock visibility, trust signals, and broker lead flow \u2014 free in under 60 seconds.'
)

# Fix the bullet points in claim section
old_bullets = '''                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Instant verification available</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search &amp; on map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>'''
new_bullets = '''                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search &amp; on map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Verification badge when eligible</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>'''
src = src.replace(old_bullets, new_bullets)

open(path, 'w', encoding='utf-8').write(src)
print("Claim fix done")

# Verify
checks = [
    ('sentinel handled', 'totalOperators === -1'),
    ('GLOBAL_MARKETS', 'GLOBAL_MARKETS'),
    ('intent cards', 'Need coverage today'),
    ('Q&A fix', 'U.S. answers reference FMCSA'),
    ('claim language', 'operators are listed on Haul Command'),
    ('claim badge', 'Verification badge when eligible'),
    ('market status', 'Live = active operators'),
]
src2 = open(path, encoding='utf-8').read()
for name, needle in checks:
    status = "OK" if needle in src2 else "MISS"
    print(f"  [{status}] {name}")
