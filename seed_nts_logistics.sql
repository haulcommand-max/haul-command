-- Seeding NTS Logistics from scraped data
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
  'nationwide-transport-services',
  'Nationwide Transport Services (NTS Logistics)',
  'FL',
  'Fort Lauderdale',
  ARRAY['pilot_car', 'oversize_load_escorting', 'route_surveys', 'nationwide_coverage', 'heavy_haul', 'permit_acquiring'],
  '(877) 278-3135',
  'https://ntslogistics.com',
  'Nationwide Transport Services offers trustworthy and reliable cross country pilot car transport services. Headquarters located at 2765 W. Cypress Creek Rd., Fort Lauderdale, FL.',
  'live',
  'OFFICIAL',
  true
) ON CONFLICT (slug) DO NOTHING;
