SELECT
  (SELECT count(*) FROM directory_listings WHERE country_code = 'US' AND is_visible = true) AS us_profiles,
  (SELECT count(*) FROM directory_listings WHERE country_code = 'US' AND is_visible = true AND metadata->>'phone' IS NOT NULL AND metadata->>'phone' != '') AS us_with_phone,
  (SELECT count(*) FROM directory_listings WHERE is_visible = true) AS global_profiles,
  (SELECT count(*) FROM directory_listings WHERE is_visible = true AND metadata->>'phone' IS NOT NULL AND metadata->>'phone' != '') AS global_with_phone,
  (SELECT count(*) FROM hc_places WHERE country_code = 'US' AND status = 'published') AS hc_places_us,
  (SELECT count(*) FROM hc_places WHERE country_code = 'US' AND status = 'published' AND phone IS NOT NULL AND phone != '') AS hc_places_us_with_phone;
