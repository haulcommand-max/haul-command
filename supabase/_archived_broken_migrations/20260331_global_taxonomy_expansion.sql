-- Haul Command Global Taxonomy Expansion
-- Tiers B & C Seed Data Deployment
-- Expanding the baseline 10 Tier A countries into the European Block, LatAm, and APAC.

-- 1. Insert Additional Countries (Tiers B & C)
INSERT INTO hc_countries (iso2, name, tier, currency_code, regulatory_density_score, is_active) VALUES
-- Tier B (Gold Standard European & Large Emerging)
('FR', 'France', 'Tier_B', 'EUR', 4, TRUE),
('ES', 'Spain', 'Tier_B', 'EUR', 4, TRUE),
('IT', 'Italy', 'Tier_B', 'EUR', 4, TRUE),
('SE', 'Sweden', 'Tier_B', 'SEK', 4, TRUE),
('MX', 'Mexico', 'Tier_B', 'MXN', 3, TRUE),
('IN', 'India', 'Tier_B', 'INR', 2, FALSE), -- Kept inactive strictly due to fragmented state data
('TH', 'Thailand', 'Tier_B', 'THB', 3, TRUE),

-- Tier C (Moderate volume, forming regulatory environments)
('PL', 'Poland', 'Tier_C', 'PLN', 3, TRUE),
('CZ', 'Czechia', 'Tier_C', 'CZK', 4, TRUE),
('TR', 'Turkiye', 'Tier_C', 'TRY', 3, TRUE),
('SG', 'Singapore', 'Tier_C', 'SGD', 5, TRUE),
('JP', 'Japan', 'Tier_C', 'JPY', 5, TRUE),
('CO', 'Colombia', 'Tier_C', 'COP', 2, TRUE),
('CL', 'Chile', 'Tier_C', 'CLP', 3, TRUE);

-- 2. Insert Translated Target Jurisdictions (Provinces / States / Districts)
INSERT INTO hc_jurisdictions (country_iso2, code, name) VALUES
-- France (Régions)
('FR', 'IDF', 'Île-de-France'),
('FR', 'ARA', 'Auvergne-Rhône-Alpes'),
('FR', 'NAQ', 'Nouvelle-Aquitaine'),

-- Mexico (Estados)
('MX', 'NL', 'Nuevo León'),
('MX', 'CDMX', 'Ciudad de México'),
('MX', 'CH', 'Chihuahua'),

-- Italy (Regioni)
('IT', 'LOM', 'Lombardia'),
('IT', 'VEN', 'Veneto'),
('IT', 'EMR', 'Emilia-Romagna'),

-- Spain (Comunidades Autónomas)
('ES', 'CAT', 'Cataluña'),
('ES', 'AND', 'Andalucía'),
('ES', 'MAD', 'Madrid');

-- 3. Insert Localized Dictionary Capabilities (Matching the Glossary JSON)
INSERT INTO hc_localized_capabilities (country_iso2, universal_capability, local_term, local_slug) VALUES
-- French 'Convoi Exceptionnel' Framework
('FR', 'front_escort', 'Voiture Pilote', 'voiture-pilote-convoi'),
('FR', 'rear_escort', 'Véhicule de Protection Arrière', 'vehicule-protection-arriere'),
('FR', 'route_survey', 'Étude d''Itinéraire', 'etude-itineraire-convoi'),

-- Spanish 'Transportes Especiales' Framework
('ES', 'front_escort', 'Coche Piloto', 'coche-piloto-transportes'),
('ES', 'route_survey', 'Estudio de Ruta', 'estudio-de-ruta-especial'),

-- Italian 'Trasporti Eccezionali' Framework
('IT', 'front_escort', 'Scorta Tecnica', 'scorta-tecnica-trasporti'),
('IT', 'route_survey', 'Verifica Percorso', 'verifica-percorso');

-- 4. Initial Tier B Regulatory Mappings (e.g. France Category 3 triggers)
-- Note: French lengths map to "categories". A Cat 3 is over 25m length.
INSERT INTO hc_jurisdiction_requirements 
(jurisdiction_id, highway_type, threshold_width_meters, threshold_height_meters, threshold_length_meters, rule_type, rule_json_details)
SELECT 
  id, 
  'Autoroute', 
  3.00,  -- Width threshold for basic escort
  4.50,  -- Height
  25.00, -- Length trigger for Category 3 (Convoi Exceptionnel)
  'requires_front', 
  '{"notes": "Voiture Pilote required front for Category 2. Two escorts required for Category 3."}'::jsonb
FROM hc_jurisdictions WHERE code = 'IDF' AND country_iso2 = 'FR';
