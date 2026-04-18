-- WAVE-10: 120-Country SEO Landing Pages & IndexNow Registration
-- Fully additive.

-- 1. Create a trigger function to register country landing pages in seo_page_registry
CREATE OR REPLACE FUNCTION fn_auto_register_country_landing_seo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.published = true THEN
    PERFORM fn_register_seo_url(
      '/directory/' || LOWER(NEW.country_iso),
      'country',
      NEW.country_iso,
      NULL,
      0.95 -- High priority for country pillar pages
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Attach trigger to country_landing_pages table
DROP TRIGGER IF EXISTS trg_country_landing_seo ON country_landing_pages;
CREATE TRIGGER trg_country_landing_seo
  AFTER INSERT OR UPDATE OF published, title ON country_landing_pages
  FOR EACH ROW EXECUTE FUNCTION fn_auto_register_country_landing_seo();


-- 3. Backfill all 120 countries into country_landing_pages (from country_registry)
-- The 3 primary countries (US, CA, AU) were already seeded in 0047, so we use ON CONFLICT DO NOTHING.
INSERT INTO country_landing_pages (
  country_iso, 
  title, 
  meta_description, 
  hero_headline, 
  published
)
SELECT 
  cr.iso,
  'Heavy Haul Escort & Pilot Car Directory — ' || cr.name || ' | Haul Command',
  'Find verified heavy haul escort operators and pilot car services in ' || cr.name || '. Trusted by the transport industry.',
  cr.name || '''s Heavy Haul Operating System',
  true -- publish them so IndexNow picks them up immediately (as 'waitlist' or 'live' accordingly)
FROM country_registry cr
ON CONFLICT (country_iso) DO NOTHING;


-- 4. Retroactively register existing 3 countries if they were missed before the trigger existed
SELECT fn_register_seo_url(
  '/directory/' || LOWER(country_iso),
  'country',
  country_iso,
  NULL,
  0.95
) 
FROM country_landing_pages 
WHERE published = true;
