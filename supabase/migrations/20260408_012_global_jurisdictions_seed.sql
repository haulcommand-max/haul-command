-- Migration: 20260408_012_global_jurisdictions_seed.sql
-- Seed global training jurisdictions from confirmed sources

CREATE TABLE IF NOT EXISTS public.training_regulation_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES public.training_jurisdictions(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_title TEXT,
    authority_name TEXT,
    source_type TEXT,
    training_value_score INT
);

WITH ins_jurisdictions AS (
    INSERT INTO public.training_jurisdictions 
        (country_code, region_code, credential_type, is_mandatory, official_path_url)
    VALUES 
        ('US', 'US-FLORIDA', 'government', true, 'https://www.eng.ufl.edu/techtransfer/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf'),
        ('US', 'US-NEW YORK', 'government', true, 'https://www.dot.ny.gov/portal/page/portal/nypermits/repository/Vehicle%20Escort%20Manual_Final_2025.pdf'),
        ('US', 'US-NORTH CAROLINA', 'government', true, 'https://connect.ncdot.gov/business/trucking/Documents/2024%20EVO%20Handbook.pdf'),
        ('US', 'US-GEORGIA', 'government', true, 'https://www.dot.ga.gov/PartnerSmart/permits/Documents/StudentWorkbook.pdf'),
        ('US', 'US-VIRGINIA', 'government', true, 'https://www.dmv.virginia.gov/sites/default/files/forms/hp405.pdf'),
        ('US', NULL, 'government', true, 'https://ops.fhwa.dot.gov/publications/fhwahop16050/fhwahop16050.pdf'),
        ('CA', 'CA-ALBERTA', 'government', true, 'https://open.alberta.ca/dataset/e7e17bc6-80e2-425a-a915-56c30716d281/resource/a0156b1f-f8ff-4819-a065-59db945fb367/download/trans-escort-vehicle-operators-handbook.pdf'),
        ('CA', 'CA-BRITISH COLUMBIA', 'government', true, 'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/cvse/commercial-transportation-manual/chapter-8.pdf'),
        ('AU', NULL, 'government', true, 'https://www.nhvr.gov.au/document/229'),
        ('AU', 'AU-QUEENSLAND', 'government', true, 'https://www.publications.qld.gov.au/dataset/4ab822b5-6ae5-44f8-934a-12c91badbb5a/resource/8bb71a5a-1423-4984-9226-e2da114affc0/download/queensland-access-conditions-guide-version-6-december-2023.pdf'),
        ('AU', 'AU-SOUTH AUSTRALIA', 'government', true, 'https://www.sa.gov.au/__data/assets/pdf_file/0004/16177/Escorting-Guidelines.pdf'),
        ('NZ', NULL, 'government', true, 'https://www.nzta.govt.nz/assets/resources/vdam-permitting-manual/VDAM-Permitting-Manual-VOL-1-Record-of-Amends8-1-Aug-2022.pdf'),
        ('GB', NULL, 'government', true, 'https://assets.publishing.service.gov.uk/media/5a801968e5274a2e8ab4e2db/Lighting_and_marking_COP_for_abnormal_load_self_escorting_vehicles_HE_rebranding_v1.pdf'),
        ('SE', NULL, 'government', true, 'https://bransch.trafikverket.se/for-dig-i-branschen/vag/Transportdispens/nar-du-fatt-beslutet/Vagtransportledare/'),
        ('BE', 'BE-WALLONIA', 'government', true, 'https://permis-environnement.spw.wallonie.be/contents/iodda/3984.html'),
        ('NL', NULL, 'government', true, 'https://www.rdw.nl/zakelijke-partners/exceptioneel-transport'),
        ('ES', NULL, 'government', true, 'https://www.dgt.es/nuestros-servicios/autorizaciones-obras-y-usos-excepcionales-de-la-via/autorizaciones-especiales-de-circulacion/autorizaciones-complementarias-de-circulacion-para-vertes/comunicacion-de-inicio-de-viaje-acc/'),
        ('FI', NULL, 'government', true, 'https://www.traficom.fi/sites/default/files/media/file/Erikoiskuljetusm%C3%A4%C3%A4r%C3%A4ys_FI.pdf'),
        ('FR', NULL, 'government', true, 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000023956514'),
        ('AT', NULL, 'government', true, 'https://www.asfinag.at/verkehr-sicherheit/lkw-bus/sondertransporte/'),
        ('JP', NULL, 'government', true, 'https://www.mlit.go.jp/road/tokusya/haitijoken/pdf/03.pdf'),
        ('SG', NULL, 'government', true, 'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/commercial-vehicles.html'),
        ('BR', NULL, 'government', true, 'https://www.gov.br/prf/pt-br/assuntos/escolta-de-cargas/m-17-manual-carga-indivisivel'),
        ('ZA', NULL, 'government', true, 'https://www.transport.gov.za/wp-content/uploads/2023/02/TRH11_AdministrativeGuidelines-1stEdition2010_Final_.pdf'),
        ('CL', NULL, 'government', true, 'https://vialidad.mop.gob.cl/uploads/sites/9/2025/02/Manual_Autorizaciones_para_tansportes_especiales_v2023.pdf')
    ON CONFLICT (country_code, COALESCE(region_code, '')) DO UPDATE SET official_path_url = EXCLUDED.official_path_url RETURNING id, country_code, region_code
),
ins_tracks AS (
    INSERT INTO public.training_tracks
        (jurisdiction_id, track_slug, title, track_type, official_course_hours_total, hc_estimated_prep_hours_total)
    SELECT id, 'pre-qualification-prep', 'Pre-Certification Prep / Pre-Qualification', 'certification', 8.0, 6.0
    FROM ins_jurisdictions
    ON CONFLICT (track_slug, jurisdiction_id) DO UPDATE SET title = EXCLUDED.title 
    RETURNING id, jurisdiction_id
)
INSERT INTO public.training_modules 
    (track_id, sequence_order, module_slug, module_title, visible_text_ready, structured_data_ready, search_ready)
SELECT
    t.id, 1, 'module-1-regulations-prep', 'Pre-Qualification Prep Module 1', true, true, true
FROM ins_tracks t
ON CONFLICT (module_slug, track_id) DO NOTHING;


-- Populate Sources
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.eng.ufl.edu/techtransfer/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf', 'PE Participant Workbook', 'University of Florida Tech Transfer', 'official_training_workbook', 98
        FROM public.training_jurisdictions WHERE country_code = 'US' AND COALESCE(region_code, '') = 'US-FLORIDA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.dot.ny.gov/portal/page/portal/nypermits/repository/Vehicle%20Escort%20Manual_Final_2025.pdf', 'Vehicle Escort Manual Final 2025', 'New York State Department of Transportation', 'official_training_manual', 97
        FROM public.training_jurisdictions WHERE country_code = 'US' AND COALESCE(region_code, '') = 'US-NEW YORK';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://connect.ncdot.gov/business/trucking/Documents/2024%20EVO%20Handbook.pdf', '2024 EVO Handbook', 'North Carolina Department of Transportation', 'official_training_handbook', 96
        FROM public.training_jurisdictions WHERE country_code = 'US' AND COALESCE(region_code, '') = 'US-NORTH CAROLINA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.dot.ga.gov/PartnerSmart/permits/Documents/StudentWorkbook.pdf', 'Student Workbook', 'Georgia Department of Transportation', 'official_training_workbook', 92
        FROM public.training_jurisdictions WHERE country_code = 'US' AND COALESCE(region_code, '') = 'US-GEORGIA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.dmv.virginia.gov/sites/default/files/forms/hp405.pdf', 'Escort Vehicle Driver''s Manual', 'Virginia DMV', 'official_training_manual', 94
        FROM public.training_jurisdictions WHERE country_code = 'US' AND COALESCE(region_code, '') = 'US-VIRGINIA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://ops.fhwa.dot.gov/publications/fhwahop16050/fhwahop16050.pdf', 'Pilot/Escort Vehicle Operators Training Manual', 'Federal Highway Administration', 'official_training_manual', 95
        FROM public.training_jurisdictions WHERE country_code = 'US' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://open.alberta.ca/dataset/e7e17bc6-80e2-425a-a915-56c30716d281/resource/a0156b1f-f8ff-4819-a065-59db945fb367/download/trans-escort-vehicle-operators-handbook.pdf', 'Escort Vehicle Operator''s Handbook', 'Government of Alberta', 'official_training_handbook', 92
        FROM public.training_jurisdictions WHERE country_code = 'CA' AND COALESCE(region_code, '') = 'CA-ALBERTA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/cvse/commercial-transportation-manual/chapter-8.pdf', 'Commercial Transportation Manual Chapter 8', 'Government of British Columbia', 'official_operator_guide', 88
        FROM public.training_jurisdictions WHERE country_code = 'CA' AND COALESCE(region_code, '') = 'CA-BRITISH COLUMBIA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.nhvr.gov.au/document/229', 'Pilot and escort recognition and training – Information sheet', 'National Heavy Vehicle Regulator', 'official_training_standard', 86
        FROM public.training_jurisdictions WHERE country_code = 'AU' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.publications.qld.gov.au/dataset/4ab822b5-6ae5-44f8-934a-12c91badbb5a/resource/8bb71a5a-1423-4984-9226-e2da114affc0/download/queensland-access-conditions-guide-version-6-december-2023.pdf', 'Queensland Access Conditions Guide', 'Queensland Government', 'official_operator_guide', 85
        FROM public.training_jurisdictions WHERE country_code = 'AU' AND COALESCE(region_code, '') = 'AU-QUEENSLAND';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.sa.gov.au/__data/assets/pdf_file/0004/16177/Escorting-Guidelines.pdf', 'Escorting Guidelines for oversize and overmass vehicles and loads in South Australia', 'Government of South Australia', 'official_operator_guide', 90
        FROM public.training_jurisdictions WHERE country_code = 'AU' AND COALESCE(region_code, '') = 'AU-SOUTH AUSTRALIA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.nzta.govt.nz/assets/resources/vdam-permitting-manual/VDAM-Permitting-Manual-VOL-1-Record-of-Amends8-1-Aug-2022.pdf', 'Vehicle Dimensions and Mass Permitting Manual Volume 1', 'NZ Transport Agency Waka Kotahi', 'official_permit_manual', 84
        FROM public.training_jurisdictions WHERE country_code = 'NZ' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.nzqa.govt.nz/nqfdocs/units/pdf/23892.pdf', 'Unit Standard 23892 - Pilot an overweight and overdimension load as a Class 1 certified pilot', 'New Zealand Qualifications Authority', 'official_training_standard', 90
        FROM public.training_jurisdictions WHERE country_code = 'NZ' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://assets.publishing.service.gov.uk/media/5a801968e5274a2e8ab4e2db/Lighting_and_marking_COP_for_abnormal_load_self_escorting_vehicles_HE_rebranding_v1.pdf', 'Code of Practice for abnormal load self-escorting vehicles', 'UK Government', 'official_operator_guide', 82
        FROM public.training_jurisdictions WHERE country_code = 'GB' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://bransch.trafikverket.se/for-dig-i-branschen/vag/Transportdispens/nar-du-fatt-beslutet/Vagtransportledare/', 'Vägtransportledare', 'Trafikverket', 'official_escort_certification', 78
        FROM public.training_jurisdictions WHERE country_code = 'SE' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://permis-environnement.spw.wallonie.be/contents/iodda/3984.html', 'Devenir accompagnateur de transport exceptionnel', 'Service public de Wallonie', 'official_escort_certification', 88
        FROM public.training_jurisdictions WHERE country_code = 'BE' AND COALESCE(region_code, '') = 'BE-WALLONIA';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.rdw.nl/zakelijke-partners/exceptioneel-transport', 'Exceptioneel transport', 'RDW', 'official_permit_portal', 80
        FROM public.training_jurisdictions WHERE country_code = 'NL' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.dgt.es/nuestros-servicios/autorizaciones-obras-y-usos-excepcionales-de-la-via/autorizaciones-especiales-de-circulacion/autorizaciones-complementarias-de-circulacion-para-vertes/comunicacion-de-inicio-de-viaje-acc/', 'Comunicación de inicio de viaje ACC', 'Dirección General de Tráfico', 'official_operator_guide', 82
        FROM public.training_jurisdictions WHERE country_code = 'ES' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.traficom.fi/sites/default/files/media/file/Erikoiskuljetusm%C3%A4%C3%A4r%C3%A4ys_FI.pdf', 'Erikoiskuljetukset ja erikoiskuljetusajoneuvot', 'Traficom', 'official_operator_guide', 84
        FROM public.training_jurisdictions WHERE country_code = 'FI' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000023956514', 'Arrêté du 2 mai 2011 relatif aux modalités de mise en oeuvre de la formation professionnelle spécifique', 'Legifrance', 'official_training_standard', 84
        FROM public.training_jurisdictions WHERE country_code = 'FR' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006053685', 'Arrêté du 4 mai 2006 relatif aux transports exceptionnels', 'Legifrance', 'official_statute_or_regulation', 82
        FROM public.training_jurisdictions WHERE country_code = 'FR' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.asfinag.at/verkehr-sicherheit/lkw-bus/sondertransporte/', 'Sondertransporte', 'ASFINAG', 'official_permit_portal', 76
        FROM public.training_jurisdictions WHERE country_code = 'AT' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.mlit.go.jp/road/tokusya/haitijoken/pdf/03.pdf', '特殊車両の通行に係る誘導等ガイドライン', 'Ministry of Land Infrastructure Transport and Tourism', 'official_operator_guide', 85
        FROM public.training_jurisdictions WHERE country_code = 'JP' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.tokusya.ktr.mlit.go.jp/PR/pdf/videojuko-guide_202012.pdf', '特殊車両の通行に係る誘導等講習', 'Ministry of Land Infrastructure Transport and Tourism', 'official_training_standard', 88
        FROM public.training_jurisdictions WHERE country_code = 'JP' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/commercial-vehicles.html', 'Commercial Vehicles', 'Land Transport Authority Singapore', 'official_permit_portal', 83
        FROM public.training_jurisdictions WHERE country_code = 'SG' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/AHVMBrochure.pdf', 'AHVM Brochure', 'Land Transport Authority Singapore', 'official_operator_guide', 80
        FROM public.training_jurisdictions WHERE country_code = 'SG' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.gov.br/prf/pt-br/assuntos/escolta-de-cargas/m-17-manual-carga-indivisivel', 'M-017 - Manual dos Serviços de Escolta de Cargas Indivisíveis e Superdimensionadas', 'Polícia Rodoviária Federal', 'official_training_manual', 90
        FROM public.training_jurisdictions WHERE country_code = 'BR' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.gov.br/prf/pt-br/seguranca-viaria/escolta-de-cargas/copy_of_SEI_PRF46288632PortariaNormativa.pdf', 'Portaria Normativa PRF nº 24 de 26 de janeiro de 2023', 'Polícia Rodoviária Federal', 'official_statute_or_regulation', 88
        FROM public.training_jurisdictions WHERE country_code = 'BR' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.transport.gov.za/wp-content/uploads/2023/02/TRH11_AdministrativeGuidelines-1stEdition2010_Final_.pdf', 'TRH11 Administrative Guidelines for Granting Exemption Permits', 'Department of Transport South Africa', 'official_permit_manual', 82
        FROM public.training_jurisdictions WHERE country_code = 'ZA' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://vialidad.mop.gob.cl/uploads/sites/9/2025/02/Manual_Autorizaciones_para_tansportes_especiales_v2023.pdf', 'Manual Autorizaciones para Transportes Especiales v2023', 'Dirección de Vialidad MOP', 'official_permit_manual', 85
        FROM public.training_jurisdictions WHERE country_code = 'CL' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://www.chileatiende.gob.cl/fichas/4429-autorizacion-para-que-vehiculos-con-sobrepeso-o-sobredimension-circulen-por-un-camino-publico', 'Autorización para vehículos con sobrepeso y/o sobredimensión', 'ChileAtiende / Dirección de Vialidad', 'official_permit_portal', 80
        FROM public.training_jurisdictions WHERE country_code = 'CL' AND COALESCE(region_code, '') = '';
INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, 'https://vialidad.mop.gob.cl/uploads/sites/9/2025/11/Orientaciones-para-los-usuarios-de-servicios-de-escoltas-sobredimensionadas-2025.pdf', 'Orientaciones para los usuarios de servicios de escoltas sobredimensionadas 2025', 'Dirección de Vialidad MOP', 'official_operator_guide', 78
        FROM public.training_jurisdictions WHERE country_code = 'CL' AND COALESCE(region_code, '') = '';
