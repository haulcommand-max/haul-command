BEGIN;

-- TRUNCATE existing just in case
TRUNCATE TABLE public.training_geo_fit;

-- Fetch the UUID of the main training program
DO $$ 
DECLARE
  v_training_id UUID;
BEGIN
  SELECT id INTO v_training_id FROM public.training_catalog WHERE slug = 'pilot-car-certification' LIMIT 1;

  IF v_training_id IS NULL THEN
     v_training_id := gen_random_uuid();
     INSERT INTO public.training_catalog (id, slug, title, summary, credential_level)
     VALUES (v_training_id, 'pilot-car-certification', 'Master Pilot Car Certification', 'Global standard for heavy haul transport escort', 'road_ready');
  END IF;

  INSERT INTO public.training_geo_fit (training_id, country_code, fit_type, confidence_state, freshness_state, note)
  VALUES 
  (v_training_id, 'US', 'required', 'verified_current', 'updated_recently', 'Federal guidance exists, but exact certification requirements vary state-by-state (e.g., WA, FL, NY). Highly demanded by major brokerages.'),
  (v_training_id, 'CA', 'required', 'verified_current', 'updated_recently', 'Mandatory in specific provinces like Alberta and BC; US credentials frequently recognized due to cross-border loads.'),
  (v_training_id, 'AU', 'required', 'verified_current', 'updated_recently', 'Very strict Heavy Vehicle National Law (HVNL) requires pilot drivers to hold specific local competencies. Training is strictly governed.'),
  (v_training_id, 'GB', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'No strict legal requirement for escort drivers in the UK, but code of practice highly recommends training. Known as Abnormal Load Escorts.'),
  (v_training_id, 'NZ', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Strict requirements enforced by Waka Kotahi (NZ Transport Agency) for load pilots (Class 1 & Class 2).'),
  (v_training_id, 'ZA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Abnormal load escorts are heavily utilized; professional certification differentiates top-tier operators.'),
  (v_training_id, 'IE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Follows EU abnormal load regulations. Training strongly recommended but informal.'),
  (v_training_id, 'DE', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Known as BF3/BF4 escorts. Strict mandatory certifications required by the local authorities.'),
  (v_training_id, 'FR', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Known as Voiture Pilote. Specific mandatory VPE (Véhicule de Protection et d''Accompagnement) training required depending on convoy class.'),
  (v_training_id, 'ES', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Known as Vehículo Piloto. Used for special transports, some regions have tighter enforcements.'),
  (v_training_id, 'IT', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Technical Escort (Scorta Tecnica) requires specific training and certification under Italian Highway Code.'),
  (v_training_id, 'NL', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Transportbegeleider is an official profession with a required certification process (CBR).'),
  (v_training_id, 'BE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Transport exceptionnel escorts used; closely aligned with Dutch and French standards.'),
  (v_training_id, 'SE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Vägtransportledare (Road transport leader) training is required for police-level escorts, otherwise useful.'),
  (v_training_id, 'NO', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Ledsagerbil required for specific dimensions, formal training improves commercial viability.'),
  (v_training_id, 'FI', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Erikoiskuljetusten liikenteenohjaaja (EKL) certification is required for traffic control during special transports.'),
  (v_training_id, 'DK', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Ledsagebil used strongly, governed by Færdselsstyrelsen.'),
  (v_training_id, 'CH', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Ausnahmetransportbegleiter training is governed strictly by cantonal police.'),
  (v_training_id, 'AT', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Sondertransportbegleitung heavily regulated, requiring certified escorts for specific routes.'),
  (v_training_id, 'PL', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Pilotage of oversize loads requires training (Pilot transportu nienormatywnego).'),
  (v_training_id, 'CZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Doprovod nadrozměrných nákladů relies heavily on professional standards.'),
  (v_training_id, 'SK', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Similar to CZ, escort vehicles required based on axle load and dimensions.'),
  (v_training_id, 'HU', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Túlméretes szállítmány kísérő requires specific permits from Magyar Közút.'),
  (v_training_id, 'RO', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escorta transport agabaritic is required depending on road class and dimension limits.'),
  (v_training_id, 'BG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Required above specific widths and lengths.'),
  (v_training_id, 'GR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escort vehicles required for oversize loads, specific training enhances broker trust.'),
  (v_training_id, 'PT', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Acompanhamento de transportes especiais relies largely on standardized European practices.'),
  (v_training_id, 'MX', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Vehículo Piloto required for Exceso de Dimensiones, specific SCT regulations apply.'),
  (v_training_id, 'BR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escolta Especializada required by PRF/DNIT for specific limits, training strongly recommended.'),
  (v_training_id, 'AR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escolta for Cargas Excepcionales requires specific vehicular setups and operational knowledge.'),
  (v_training_id, 'CL', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escoltas required for Transportes Especiales as per Vialidad guidelines.'),
  (v_training_id, 'CO', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Vehículos Acompañantes required depending on type of load (Resolución INVIAS).'),
  (v_training_id, 'PE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Vehículo Escolta governed by MTC, required for excess weight and dimension.'),
  (v_training_id, 'AE', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Strict requirements by RTA/Police for escort operations.'),
  (v_training_id, 'SA', 'required', 'seeded_needs_review', 'seeded_needs_review', 'Ministry of Transport and Logistics specifies strict escort requirements.'),
  (v_training_id, 'QA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escorts managed directly with local traffic police for major infrastructure hauls.'),
  (v_training_id, 'KW', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Heavy reliance on specific clearance from Ministry of Interior for oversize movement.'),
  (v_training_id, 'OM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'ROP (Royal Oman Police) governs escort requirements strictly.'),
  (v_training_id, 'BH', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escort provisions often required for cross-causeway transport.'),
  (v_training_id, 'IN', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Pilot / Escort Vehicles required for ODC (Over Dimensional Cargo) per MoRTH, but loosely enforced.'),
  (v_training_id, 'JP', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Induction vehicles (誘導車) formally required for special vehicles exceeding limits.'),
  (v_training_id, 'KR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Safety escort required for specific over-limit dimensions.'),
  (v_training_id, 'TW', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Specific police and private escorts required for large equipment transports.'),
  (v_training_id, 'SG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Auxiliary Police or private escorts required for L.E.M. (Large Extent Movement).'),
  (v_training_id, 'MY', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escort vehicles required by JKR / Police for heavy construction loads.'),
  (v_training_id, 'ID', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Pengawalan required for heavy haulage, often involving police.'),
  (v_training_id, 'TH', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Escort requirements depend on Department of Highways regulations.'),
  (v_training_id, 'VN', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Xe hộ tống required for super-heavy, super-sized goods per MOT.'),
  (v_training_id, 'PH', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'DPWH/LTO dictates guidelines for oversize loads, escort typically required.'),
  (v_training_id, 'TR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'Öncü / artçı araçlar (front/rear escort vehicles) required per KGM for special loads.');

  -- And default the remaining 70 countries to 'useful' to ensure row existence for Sitemaps.
  INSERT INTO public.training_geo_fit (training_id, country_code, fit_type, confidence_state, freshness_state, note)
  VALUES 
  (v_training_id, 'EG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'DZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'NG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'KE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'GH', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'TZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'EC', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'UY', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'PY', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BO', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'PA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'CR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'DO', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'JM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'TT', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BS', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'FJ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'EE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'LV', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'LT', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'HR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'SI', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'RS', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'ME', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MK', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'AL', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'UA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MD', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'GE', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'AM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'AZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'KZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'UZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'TM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'KG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'TJ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MN', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'PK', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BD', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'LK', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'NP', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'AO', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BW', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'NA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'ZM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'ZW', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'UG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'RW', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'SN', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'CI', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'CM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'ET', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MU', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'PG', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BN', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'KH', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'LA', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'MM', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'HN', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'SV', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'GT', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'NI', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'BZ', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'GY', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'SR', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.'),
  (v_training_id, 'IS', 'useful', 'seeded_needs_review', 'seeded_needs_review', 'General heavy-haul safety practices apply.');

END $$;

COMMIT;
