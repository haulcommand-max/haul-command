-- Seeding Cooks & Son Pilot Car Escort Service manually from Facebook flyer
INSERT INTO public.provider_directory (
  slug, 
  display_name, 
  state, 
  city, 
  service_tags, 
  phone, 
  website, 
  description, 
  coverage_status, 
  source_quality, 
  verified
) VALUES (
  'cooks-and-son-pilot-car-escort-service',
  'Cooks & Son Pilot Car Escort Service',
  'TX', -- Assuming Texas based on the "Texas, Regional & Nationwide Coverage" and the 832 (Houston) area code
  'Houston', -- 832 is heavily Houston/surrounding areas
  ARRAY['pilot_car', 'oversize_load_escorting', 'nationwide_coverage', 'regional_coverage'],
  '(832) 445-6217',
  'https://www.cooksandson.com',
  'Safe, reliable, professional pilot car escort services. Providing oversize load escorting with experienced drivers for Texas, Regional & Nationwide coverage.',
  'live',
  'SECONDARY',
  true
) ON CONFLICT (slug) DO NOTHING;
