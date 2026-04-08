CREATE OR REPLACE FUNCTION try_cast_uuid(text) RETURNS uuid AS $$
BEGIN
    RETURN $1::uuid;
EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE VIEW listings AS
SELECT 
  try_cast_uuid(provider_key) as id,
  name_raw as full_name,
  city,
  state,
  country as country_code,
  rating_avg as rating,
  rating_count as review_count,
  (claim_status = 'claimed') as claimed,
  string_to_array(category_raw, ',') as services,
  trust_score * 100 as rank_score,
  false as featured,
  slug,
  (status = 'active' OR status = 'live') as active
FROM providers;
