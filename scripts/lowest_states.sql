SELECT region_code, COUNT(*) as num_profiles
FROM public.directory_listings
WHERE country_code = 'US' AND region_code IS NOT NULL
GROUP BY region_code
ORDER BY num_profiles ASC
LIMIT 10;
