-- Migration: SEED OSOW HAVEN BATCH (MOCKED INGESTION RESULTS)
-- Total Records Extracted: 59
-- Processed via G-ING-01 Node script

-- INSERT OPERATOR: 1st Amber Lights Pilot Car
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15033100423') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      '1st Amber Lights Pilot Car', 'OR', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/4b129fcf-dbb4-4c1d-bd7a-dbac7391a00d/', '4b129fcf-dbb4-4c1d-bd7a-dbac7391a00d', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15033100423', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: 1st American Pilot Cars LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15036454276') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      '1st American Pilot Cars LLC', 'OR', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/5d19122f-a616-46b5-adad-8813b8de1609/', '5d19122f-a616-46b5-adad-8813b8de1609', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15036454276', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: 1st Choice Pilots
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15032822902') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      '1st Choice Pilots', 'AZ', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/5f8abf99-7723-449e-b836-df3b9142279a/', '5f8abf99-7723-449e-b836-df3b9142279a', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15032822902', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: 365 Pilots
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+18667950150') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      '365 Pilots', 'AL', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/b0af75a7-bc4e-4555-839d-48ff477f8abc/', 'b0af75a7-bc4e-4555-839d-48ff477f8abc', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+18667950150', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A-1 Pilot Car Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17193306080') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A-1 Pilot Car Inc', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/55833236-326d-4bff-9a6a-0c2a1ffd1f8d/', '55833236-326d-4bff-9a6a-0c2a1ffd1f8d', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17193306080', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A1 Pilotcar Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12052692929') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A1 Pilotcar Service', 'AL', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/a4891958-5425-4584-861a-8a8e4e254d46/', 'a4891958-5425-4584-861a-8a8e4e254d46', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12052692929', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A2B Escort & Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12704078412') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A2B Escort & Pilot Car Service', 'KY', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/b26b63cd-8fb5-4cc2-94cc-41f239caf2e3/', 'b26b63cd-8fb5-4cc2-94cc-41f239caf2e3', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12704078412', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A 2 Z Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17038988718') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A 2 Z Pilot Car Service', 'VA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/81608877-388a-4bc8-8452-a5ec00a7743f/', '81608877-388a-4bc8-8452-a5ec00a7743f', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17038988718', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: AAA Blair Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+18002871429') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'AAA Blair Pilot Car Service', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/91d350dc-4927-48d7-b89b-3789c123717f/', '91d350dc-4927-48d7-b89b-3789c123717f', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+18002871429', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: AAA Mountain Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+19707596678') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'AAA Mountain Pilot Car Service', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/1a423c24-25eb-47fd-9b4d-b53995bc1b2e/', '1a423c24-25eb-47fd-9b4d-b53995bc1b2e', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+19707596678', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A & A Davis Pilot Car LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12053103019') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A & A Davis Pilot Car LLC', 'AL', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/0a96b166-336b-4b5a-b9ad-3034640e5830/', '0a96b166-336b-4b5a-b9ad-3034640e5830', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12053103019', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: ABC Colt
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17162222658') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'ABC Colt', 'NY', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/c085dbcf-4d22-4d5f-8b79-4fc7dd90cc85/', 'c085dbcf-4d22-4d5f-8b79-4fc7dd90cc85', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17162222658', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A Better Choice OES
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12084797290') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A Better Choice OES', 'NM', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/1884614d-fd7a-4604-91ce-97f40af3dd9b/', '1884614d-fd7a-4604-91ce-97f40af3dd9b', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12084797290', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Absolute Pilot and Flagging
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15032696705') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Absolute Pilot and Flagging', 'OR', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/c0f81095-780e-45fc-bdcb-72f64ded6746/', 'c0f81095-780e-45fc-bdcb-72f64ded6746', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15032696705', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A&J''s Escort/Flag Car Svc Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+18036041220') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A&J''s Escort/Flag Car Svc Inc', 'GA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/8b9e29b6-faeb-427e-a5cb-a28af71147c8/', '8b9e29b6-faeb-427e-a5cb-a28af71147c8', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+18036041220', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: AKN Trucking & Pilot Car Service LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14058827001') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'AKN Trucking & Pilot Car Service LLC', 'OK', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/d790992f-d3f6-4f3e-beb0-5f461d3f2902/', 'd790992f-d3f6-4f3e-beb0-5f461d3f2902', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14058827001', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: All State Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17194654643') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'All State Pilot Cars', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/9d658d47-d96c-4eb9-a007-9ed3d168039e/', '9d658d47-d96c-4eb9-a007-9ed3d168039e', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17194654643', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Almost Heaven Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+13043604102') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Almost Heaven Pilot Cars', 'WV', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/243a8443-7b0e-4ab4-9941-6bb454c56f9b/', '243a8443-7b0e-4ab4-9941-6bb454c56f9b', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+13043604102', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Alterna Pilot Car Service LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15039705821') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Alterna Pilot Car Service LLC', 'CA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/bb0760a2-8395-4c15-8194-05f582529c0f/', 'bb0760a2-8395-4c15-8194-05f582529c0f', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15039705821', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Amber Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+19198092313') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Amber Pilot Cars', 'FL', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/73854e53-92be-4582-a900-b90eb36c013e/', '73854e53-92be-4582-a900-b90eb36c013e', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+19198092313', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: American Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+16614729100') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'American Pilot Car Service', 'CA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/f827356c-0518-4299-ae2e-126566994c9e/', 'f827356c-0518-4299-ae2e-126566994c9e', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+16614729100', true);

    
  END IF;
END $$;

-- INSERT OPERATOR: Ameripilot Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12163074568') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Ameripilot Inc', 'OH', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/1a3eddb9-2f21-406c-ac82-61b845765399/', '1a3eddb9-2f21-406c-ac82-61b845765399', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12163074568', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Anstorm Sabre PCS LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14022702125') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Anstorm Sabre PCS LLC', 'AZ', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/6d54b782-be1b-4345-a515-5232d5552cd9/', '6d54b782-be1b-4345-a515-5232d5552cd9', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14022702125', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Any Dimension Logistics LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+18329968829') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Any Dimension Logistics LLC', 'AZ', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/d30e5e22-e20c-4454-928a-c2d310803b3a/', 'd30e5e22-e20c-4454-928a-c2d310803b3a', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+18329968829', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Anytime Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17075924294') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Anytime Pilot Car Service', 'CA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/4e5a640f-4de1-415f-bcc5-c2ee3aa82970/', '4e5a640f-4de1-415f-bcc5-c2ee3aa82970', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17075924294', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A One Pilot
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17863509064') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A One Pilot', 'FL', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/dcad0ca1-663e-4049-917a-e81129b3f593/', 'dcad0ca1-663e-4049-917a-e81129b3f593', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17863509064', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A Patel Pilot Car Company
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17852060065') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A Patel Pilot Car Company', 'IA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/6a2e71d7-8404-49ef-80e9-d62d4ef48d2e/', '6a2e71d7-8404-49ef-80e9-d62d4ef48d2e', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17852060065', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A+ Pilots LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17123352699') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A+ Pilots LLC', 'IA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/d6f96eed-8aef-4ac4-b570-87657dc67a59/', 'd6f96eed-8aef-4ac4-b570-87657dc67a59', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17123352699', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A-Plus PC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15412813474') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A-Plus PC', 'CA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/d0a8812c-0bbc-4604-969b-bf470001cc70/', 'd0a8812c-0bbc-4604-969b-bf470001cc70', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15412813474', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Apples and Oranges Pilots
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12408186454') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Apples and Oranges Pilots', 'MD', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/9d9cc685-9b98-4d10-967d-3b9acc1ec8d8/', '9d9cc685-9b98-4d10-967d-3b9acc1ec8d8', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12408186454', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Arizona Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+16026995755') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Arizona Pilot Car Service', 'AZ', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/942ef734-ba4c-467c-8d5d-67b0eb9e4a4a/', '942ef734-ba4c-467c-8d5d-67b0eb9e4a4a', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+16026995755', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: A to B Pilot Car Escort Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12819238136') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'A to B Pilot Car Escort Service', 'TX', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/a43b6098-90cd-493a-9d70-8f911b137f80/', 'a43b6098-90cd-493a-9d70-8f911b137f80', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12819238136', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Aumor Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12626662266') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Aumor Inc', 'WI', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/805f38d5-785a-4232-8138-33342d178e9c/', '805f38d5-785a-4232-8138-33342d178e9c', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12626662266', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Auto Pilot LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+13604305021') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Auto Pilot LLC', 'WA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/c5d7e751-e473-4d32-81e6-7701fed8916c/', 'c5d7e751-e473-4d32-81e6-7701fed8916c', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+13604305021', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Backdraft Pilot Car NY Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14843575057') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Backdraft Pilot Car NY Inc', 'NY', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/ed118ed6-8da7-4616-a84b-0e78ffeac1f6/', 'ed118ed6-8da7-4616-a84b-0e78ffeac1f6', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14843575057', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Back Off Flag Car Services
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+13013057563') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Back Off Flag Car Services', 'MD', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/dd23e52f-eb22-4941-9f5c-a05730beca55/', 'dd23e52f-eb22-4941-9f5c-a05730beca55', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+13013057563', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Baker Pilot Car/Escort
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+16056417404') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Baker Pilot Car/Escort', 'SD', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/447c41f3-fdec-422a-8abe-dc86cc057ba0/', '447c41f3-fdec-422a-8abe-dc86cc057ba0', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+16056417404', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Bama Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14692234620') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Bama Pilot Cars', 'TX', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/2de61d75-adaa-4786-a9e9-5057aa8acf0a/', '2de61d75-adaa-4786-a9e9-5057aa8acf0a', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14692234620', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Barbwire Pilot Car
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17753887447') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Barbwire Pilot Car', 'NV', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/b9b88b46-0da4-4d78-848e-d7f237b13d1a/', 'b9b88b46-0da4-4d78-848e-d7f237b13d1a', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17753887447', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: BA''s Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+19037443166') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'BA''s Pilot Car Service', 'AR', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/a62be62e-9acb-416c-abeb-d5f1ee46e25d/', 'a62be62e-9acb-416c-abeb-d5f1ee46e25d', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+19037443166', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Becky''s Pilot Car LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17194299617') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Becky''s Pilot Car LLC', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/dde2b14a-831f-4451-9aad-d3a0827e9238/', 'dde2b14a-831f-4451-9aad-d3a0827e9238', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17194299617', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Beehive State Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+18015550234') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Beehive State Pilot Cars', 'UT', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/5a0d5d77-7a55-4dd0-a05e-615c5143372e/', '5a0d5d77-7a55-4dd0-a05e-615c5143372e', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+18015550234', true);

  END IF;
END $$;

-- INSERT OPERATOR: Best Choice Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+15038572556') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Best Choice Inc', 'ID', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/5c8d29e6-e3da-4753-9ed0-5eab8ea4a1c5/', '5c8d29e6-e3da-4753-9ed0-5eab8ea4a1c5', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+15038572556', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Best Transport Escort
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+13176944444') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Best Transport Escort', 'IN', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/c09111db-7b3e-4a83-b771-e709b43e32d4/', 'c09111db-7b3e-4a83-b771-e709b43e32d4', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+13176944444', true);

    
  END IF;
END $$;

-- INSERT OPERATOR: Big Dog Services Inc
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17208106155') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Big Dog Services Inc', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/257d4e20-f5e6-4ad9-95d6-69e26eac9d4c/', '257d4e20-f5e6-4ad9-95d6-69e26eac9d4c', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17208106155', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Big D''s Pilot Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12082600776') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Big D''s Pilot Service', 'ID', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/d2054147-9ab7-476b-a208-64339c38b0a9/', 'd2054147-9ab7-476b-a208-64339c38b0a9', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12082600776', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Big Rig Escorts LLC
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14134410542') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Big Rig Escorts LLC', 'MA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/a7372a4f-577d-4701-9873-81266896a4f9/', 'a7372a4f-577d-4701-9873-81266896a4f9', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14134410542', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Big Sky Pilots
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14066975909') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Big Sky Pilots', 'MT', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/88b3f653-bfbe-4848-8caf-0cbc93fa9b63/', '88b3f653-bfbe-4848-8caf-0cbc93fa9b63', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14066975909', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Big T''s Pilot Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17204251035') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Big T''s Pilot Service', 'CO', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/329cda78-6a36-4ed7-a628-d0daee1c246b/', '329cda78-6a36-4ed7-a628-d0daee1c246b', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17204251035', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Billy''s Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+12093296608') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Billy''s Pilot Car Service', 'CA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/be1fbea0-6c8f-4257-8d43-90731246e83b/', 'be1fbea0-6c8f-4257-8d43-90731246e83b', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+12093296608', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Black Beard
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+13862431420') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Black Beard', 'FL', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/fa7fce59-9b03-42d7-b2cb-4b80f705d5b6/', 'fa7fce59-9b03-42d7-b2cb-4b80f705d5b6', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+13862431420', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Blacksheep Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+17755605896') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Blacksheep Pilot Cars', 'NV', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/5d253a38-cb6d-44d5-a65f-9e42872d4253/', '5d253a38-cb6d-44d5-a65f-9e42872d4253', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+17755605896', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Blue Ridge Pilot Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+14345550234') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Blue Ridge Pilot Service', 'VA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/06565cf9-4ac6-46c6-8f83-1d0ad9c06fde/', '06565cf9-4ac6-46c6-8f83-1d0ad9c06fde', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+14345550234', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Blue Sky Pilot Car Service
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+19282026570') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Blue Sky Pilot Car Service', 'AZ', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/f78c34f4-136a-409e-ad4b-3c7e17f419bb/', 'f78c34f4-136a-409e-ad4b-3c7e17f419bb', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+19282026570', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'height_pole') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'route_survey') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- INSERT OPERATOR: Border Pilot Cars
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '+13607391350') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      'Border Pilot Cars', 'WA', 'US', false, 'osow_haven_directory',
      true, 'osow_haven', 'https://osowhaven.com/companies/687515b6-e004-4eb5-bb04-a79534d562b1/', '687515b6-e004-4eb5-bb04-a79534d562b1', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '+13607391350', true);

    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'lead') ON CONFLICT DO NOTHING;
    INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, 'chase') ON CONFLICT DO NOTHING;
  END IF;
END $$;
