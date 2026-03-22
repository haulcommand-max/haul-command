-- Additional 20 companies to reach 50 total company listings
INSERT INTO company_listings (slug, company_name, company_type, country_code, countries_operating, website, description, estimated_annual_escorts, primary_corridors) VALUES
  ('wabtec','Wabtec Corporation','heavy_haul','US','{US,IN,AU}','https://wabtec.com','Rail and industrial heavy transport equipment manufacturer.',1800,'{I-80 Midwest,I-90 Northeast}'),
  ('scheuerle','Scheuerle','heavy_haul','DE','{DE,US,AE}','https://scheuerle.com','German manufacturer of heavy-duty modular transporters.',1200,'{A8 Germany,I-10 US Gulf}'),
  ('nooteboom','Nooteboom Trailers','heavy_haul','NL','{NL,DE,GB,BE}','https://nooteboom.com','Dutch specialist trailer manufacturer for heavy and oversized loads.',2000,'{A2 Netherlands,A1 Germany,M1 UK}'),
  ('bnsf-logistics','BNSF Logistics','logistics','US','{US,CA,MX}','https://bnsflogistics.com','Major intermodal logistics provider with oversize freight division.',5500,'{I-40 National,I-10 Southern,I-80 Northern}'),
  ('xpo-logistics','XPO Logistics','logistics','US','{US,GB,FR,ES}','https://xpo.com','Global logistics company with specialized heavy haul capabilities.',4200,'{I-95 East Coast,A1 France,M1 UK}'),
  ('schneider-national','Schneider National','fleet','US','{US,CA,MX}','https://schneider.com','Large truckload carrier with specialized oversized freight division.',3800,'{I-94 Midwest,I-35 Central,I-10 Southern}'),
  ('perth-heavy-haulage','Perth Heavy Haulage','heavy_haul','AU','{AU}','https://pertheavyhaulage.com.au','Western Australia specialist heavy transport for mining and resources.',3200,'{Great Northern HWY,Brand HWY,NW Coastal HWY}'),
  ('macs-heavy-haulage','MACS Heavy Haulage','heavy_haul','AU','{AU}','https://macsheavyhaulage.com.au','Australian heavy haulage specialists serving mining and construction.',2800,'{Stuart HWY,Pacific HWY,Hume HWY}'),
  ('pratt-industries','Pratt Industries Transport','heavy_haul','AU','{AU,NZ}','https://prattindustries.com.au','Australian industrial heavy transport for power generation and mining.',2100,'{Pacific HWY,Warrego HWY,Bruce HWY}'),
  ('collett-transport','Collett Transport','heavy_haul','GB','{GB,IE,FR}','https://collett.co.uk','UK specialist heavy transport for wind energy and infrastructure.',2500,'{M1 UK,M62 UK,A1 UK}'),
  ('abnormal-loads','Abnormal Loads','heavy_haul','ZA','{ZA,BW,MZ,NA}','https://abnormalloads.co.za','Southern Africa heavy transport for mining and energy sectors.',1900,'{N1 South Africa,N4 Trans-Kalahari}'),
  ('hs2-transport','HS2 Transport','heavy_haul','GB','{GB}','https://hs2.org.uk','Major UK infrastructure project requiring extensive heavy transport.',3500,'{M1 UK,M40 UK,A46 UK}'),
  ('saudi-heavy-lift','Saudi Heavy Lift','heavy_haul','SA','{SA,AE,QA}','https://saudiheavylift.com','Gulf region heavy lifting and transport for petrochemical and energy.',4000,'{Riyadh-Dammam,Jeddah-Makkah,Abu Dhabi Corridors}'),
  ('enercon-brazil','Enercon Brazil','wind_energy','BR','{BR}','https://enercon.de/br','Wind turbine transport across Brazilian highways.',1600,'{BR-101,BR-116,BR-040}'),
  ('suzlon-energy','Suzlon Energy','wind_energy','IN','{IN}','https://suzlon.com','Indian wind energy manufacturer with massive blade transport needs.',2800,'{NH-48,NH-8,NH-44}'),
  ('tata-projects','Tata Projects','heavy_haul','IN','{IN,AE,SA}','https://tataprojects.com','Indian infrastructure and heavy transport for power and construction.',3200,'{NH-44,NH-48,Golden Quadrilateral}'),
  ('saipem','Saipem','heavy_haul','IT','{IT,AE,SA,NG}','https://saipem.com','Italian energy services with offshore and onshore heavy transport.',2600,'{A1 Italy,Offshore Corridors}'),
  ('lamprell','Lamprell','heavy_haul','AE','{AE,SA,QA}','https://lamprell.com','UAE energy services company with heavy module transport.',1800,'{Jebel Ali-Abu Dhabi,Abu Dhabi-Al Ain}'),
  ('jumbo-maritime','Jumbo Maritime','heavy_haul','NL','{NL,SG,AE}','https://jumbomaritime.nl','Dutch maritime heavy lift and transport company.',1400,'{Port of Rotterdam,Port of Singapore}'),
  ('ti-group','TI Group','logistics','AU','{AU,NZ}','https://tigroup.com.au','Australian integrated logistics with heavy haul division.',2300,'{Pacific HWY,Hume HWY,Stuart HWY}')
ON CONFLICT (slug) DO NOTHING;
