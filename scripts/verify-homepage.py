src = open(r'C:\Users\PC User\Biz\app\(landing)\_components\HomeClient.tsx', encoding='utf-8').read()
checks = [
    ('sentinel handled', 'totalOperators === -1'),
    ('isStatsUnavailable', 'isStatsUnavailable'),
    ('GLOBAL_MARKETS', 'GLOBAL_MARKETS'),
    ('intent cards', 'Need coverage today'),
    ('Q&A fix', 'U.S. answers reference FMCSA'),
    ('claim fix', 'Verification badge when eligible'),
    ('market status', 'Live = active operators'),
]
for name, needle in checks:
    found = needle in src
    status = "OK" if found else "MISS"
    print(f"  [{status}] {name}")
