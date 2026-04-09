-- Migration: 20260409_global_training_authority.sql
-- Description: Establishes the Global Training and Rules Authority Engine for 120 countries.

CREATE TYPE source_type_enum AS ENUM (
    'official_training_workbook',
    'official_training_standard',
    'official_escort_certification',
    'official_permit_manual',
    'official_permit_portal',
    'official_statute_or_regulation',
    'official_operator_guide',
    'regional_best_practice',
    'reputable_industry_summary'
);

CREATE TYPE official_status_enum AS ENUM (
    'official',
    'unofficial_summary',
    'academic'
);

CREATE TABLE hc_global_training_authority (
    row_key TEXT PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    country_name TEXT NOT NULL,
    state_province TEXT,
    city_region TEXT,
    jurisdiction_level TEXT NOT NULL, -- 'national', 'state', 'province', 'region'
    source_type source_type_enum NOT NULL,
    source_title TEXT NOT NULL,
    authority_name TEXT NOT NULL,
    year TEXT,
    last_updated_date TIMESTAMP WITH TIME ZONE,
    official_status official_status_enum NOT NULL DEFAULT 'official',
    training_value_score INTEGER CHECK (training_value_score >= 0 AND training_value_score <= 100),
    language VARCHAR(10) NOT NULL,
    url TEXT,
    notes TEXT,
    extract_status TEXT DEFAULT 'pending',
    
    -- Structured Rule Fields (as requested by user)
    permit_thresholds JSONB DEFAULT '{}'::jsonb,
    escort_thresholds JSONB DEFAULT '{}'::jsonb,
    training_or_certification_required BOOLEAN DEFAULT false,
    warning_vehicle_count JSONB DEFAULT '{}'::jsonb,
    vehicle_marking_rules JSONB DEFAULT '{}'::jsonb,
    authority_notification_required BOOLEAN DEFAULT false,
    fees_and_charges JSONB DEFAULT '{}'::jsonb,
    route_restrictions JSONB DEFAULT '{}'::jsonb,
    forms_and_portal_links JSONB DEFAULT '[]'::jsonb,
    effective_date TIMESTAMP WITH TIME ZONE,
    jurisdiction_scope TEXT,
    raw_source_excerpt TEXT,
    source_confidence INTEGER CHECK (source_confidence >= 0 AND source_confidence <= 100),
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for global routing and SEO queries
CREATE INDEX idx_hc_global_auth_country ON hc_global_training_authority(country_code);
CREATE INDEX idx_hc_global_auth_state ON hc_global_training_authority(state_province);
CREATE INDEX idx_hc_global_auth_jurisdiction ON hc_global_training_authority(jurisdiction_level);
CREATE INDEX idx_hc_global_auth_score ON hc_global_training_authority(training_value_score DESC);

-- RLS
ALTER TABLE hc_global_training_authority ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active authority rules" 
    ON hc_global_training_authority FOR SELECT 
    USING (true);

-- Seed Data (From User Provided Baseline)
INSERT INTO hc_global_training_authority (
    row_key, country_code, country_name, state_province, jurisdiction_level, source_type, year, official_status, training_value_score, url, source_title, authority_name, language, notes, last_verified_at
) VALUES 
('HC-001', 'US', 'United States', 'Florida', 'state', 'official_training_workbook', '2025', 'official', 98, 'https://www.eng.ufl.edu/techtransfer/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf', 'PE Participant Workbook', 'University of Florida Tech Transfer', 'en', 'public workbook / strong training seed', NOW()),
('HC-002', 'US', 'United States', 'New York', 'state', 'official_permit_manual', '2025', 'official', 97, 'https://www.dot.ny.gov/portal/page/portal/nypermits/repository/Vehicle%20Escort%20Manual_Final_2025.pdf', 'Vehicle Escort Manual Final 2025', 'New York State Department of Transportation', 'en', 'current state escort manual', NOW()),
('HC-003', 'US', 'United States', 'North Carolina', 'state', 'official_training_workbook', '2024', 'official', 96, 'https://connect.ncdot.gov/business/trucking/Documents/2024%20EVO%20Handbook.pdf', '2024 EVO Handbook', 'North Carolina Department of Transportation', 'en', 'escort certification handbook', NOW()),
('HC-004', 'US', 'United States', 'Georgia', 'state', 'official_training_workbook', 'undated', 'official', 92, 'https://www.dot.ga.gov/PartnerSmart/permits/Documents/StudentWorkbook.pdf', 'Student Workbook', 'Georgia Department of Transportation', 'en', 'official workbook public copy', NOW()),
('HC-005', 'US', 'United States', 'Virginia', 'state', 'official_operator_guide', 'undated', 'official', 94, 'https://www.dmv.virginia.gov/sites/default/files/forms/hp405.pdf', 'Escort Vehicle Driver''s Manual', 'Virginia DMV', 'en', 'official escort manual', NOW()),
('HC-006', 'US', 'United States', 'Federal', 'national', 'official_training_workbook', '2017', 'official', 95, 'https://ops.fhwa.dot.gov/publications/fhwahop16050/fhwahop16050.pdf', 'Pilot/Escort Vehicle Operators Training Manual', 'Federal Highway Administration', 'en', 'national baseline manual', NOW()),
('HC-007', 'CA', 'Canada', 'Alberta', 'province', 'official_operator_guide', '2019', 'official', 92, 'https://open.alberta.ca/dataset/e7e17bc6-80e2-425a-a915-56c30716d281/resource/a0156b1f-f8ff-4819-a065-59db945fb367/download/trans-escort-vehicle-operators-handbook.pdf', 'Escort Vehicle Operator''s Handbook', 'Government of Alberta', 'en', 'province handbook', NOW()),
('HC-008', 'CA', 'Canada', 'British Columbia', 'province', 'official_operator_guide', '2026', 'official', 88, 'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/cvse/commercial-transportation-manual/chapter-8.pdf', 'Commercial Transportation Manual Chapter 8', 'Government of British Columbia', 'en', 'pilot car requirements and procedures', NOW()),
('HC-009', 'AU', 'Australia', 'National', 'national', 'official_training_standard', 'undated', 'official', 86, 'https://www.nhvr.gov.au/document/229', 'Pilot and escort recognition and training – Information sheet', 'National Heavy Vehicle Regulator', 'en', 'cross-jurisdiction certification summary', NOW()),
('HC-010', 'AU', 'Australia', 'Queensland', 'state', 'official_operator_guide', '2023', 'official', 85, 'https://www.publications.qld.gov.au/dataset/4ab822b5-6ae5-44f8-934a-12c91badbb5a/resource/8bb71a5a-1423-4984-9226-e2da114affc0/download/queensland-access-conditions-guide-version-6-december-2023.pdf', 'Queensland Access Conditions Guide', 'Queensland Government', 'en', 'pilot and escort operational conditions', NOW()),
('HC-011', 'AU', 'Australia', 'South Australia', 'state', 'official_operator_guide', '2025', 'official', 90, 'https://www.sa.gov.au/__data/assets/pdf_file/0004/16177/Escorting-Guidelines.pdf', 'Escorting Guidelines for oversize and overmass vehicles and loads in South Australia', 'Government of South Australia', 'en', 'roles and responsibilities of pilots and escorts', NOW()),
('HC-012', 'NZ', 'New Zealand', 'National', 'national', 'official_permit_manual', '2022', 'official', 84, 'https://www.nzta.govt.nz/assets/resources/vdam-permitting-manual/VDAM-Permitting-Manual-VOL-1-Record-of-Amends8-1-Aug-2022.pdf', 'Vehicle Dimensions and Mass Permitting Manual Volume 1', 'NZ Transport Agency Waka Kotahi', 'en', 'permit and overdimension requirements', NOW()),
('HC-013', 'NZ', 'New Zealand', 'National', 'national', 'official_training_standard', '2023', 'official', 90, 'https://www.nzqa.govt.nz/nqfdocs/units/pdf/23892.pdf', 'Unit Standard 23892 - Pilot an overweight and overdimension load as a Class 1 certified pilot', 'New Zealand Qualifications Authority', 'en', 'formal pilot training standard', NOW()),
('HC-014', 'GB', 'United Kingdom', 'National', 'national', 'official_operator_guide', '2012', 'official', 82, 'https://assets.publishing.service.gov.uk/media/5a801968e5274a2e8ab4e2db/Lighting_and_marking_COP_for_abnormal_load_self_escorting_vehicles_HE_rebranding_v1.pdf', 'Code of Practice for abnormal load self-escorting vehicles', 'UK Government', 'en', 'self-escort operating guidance', NOW()),
('HC-015', 'SE', 'Sweden', 'National', 'national', 'official_escort_certification', 'undated', 'official', 78, 'https://bransch.trafikverket.se/for-dig-i-branschen/vag/Transportdispens/nar-du-fatt-beslutet/Vagtransportledare/', 'Vägtransportledare', 'Trafikverket', 'sv', 'escort role and legal basis', NOW()),
('HC-016', 'BE', 'Belgium', 'Wallonia', 'region', 'official_escort_certification', 'undated', 'official', 88, 'https://permis-environnement.spw.wallonie.be/contents/iodda/3984.html', 'Devenir accompagnateur de transport exceptionnel', 'Service public de Wallonie', 'fr', 'exam and stage path', NOW()),
('HC-017', 'NL', 'Netherlands', 'National', 'national', 'official_permit_portal', 'undated', 'official', 80, 'https://www.rdw.nl/zakelijke-partners/exceptioneel-transport', 'Exceptioneel transport', 'RDW', 'nl', 'permit and guidance hub', NOW()),
('HC-018', 'ES', 'Spain', 'National', 'national', 'official_operator_guide', '2022', 'official', 82, 'https://www.dgt.es/nuestros-servicios/autorizaciones-obras-y-usos-excepcionales-de-la-via/autorizaciones-especiales-de-circulacion/autorizaciones-complementarias-de-circulacion-para-vertes/comunicacion-de-inicio-de-viaje-acc/', 'Comunicación de inicio de viaje ACC', 'Dirección General de Tráfico', 'es', 'pilot vehicle and accompaniment thresholds', NOW()),
('HC-019', 'FI', 'Finland', 'National', 'national', 'official_operator_guide', '2020', 'official', 84, 'https://www.traficom.fi/sites/default/files/media/file/Erikoiskuljetusm%C3%A4%C3%A4r%C3%A4ys_FI.pdf', 'Erikoiskuljetukset ja erikoiskuljetusajoneuvot', 'Traficom', 'fi', 'warning car and escort framework', NOW()),
('HC-020', 'FR', 'France', 'National', 'national', 'official_training_standard', '2011', 'official', 84, 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000023956514', 'Arrêté du 2 mai 2011 relatif aux modalités de mise en oeuvre de la formation professionnelle spécifique', 'Legifrance', 'fr', 'guide vehicle driver training order', NOW()),
('HC-021', 'FR', 'France', 'National', 'national', 'official_statute_or_regulation', '2024', 'official', 82, 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006053685', 'Arrêté du 4 mai 2006 relatif aux transports exceptionnels', 'Legifrance', 'fr', 'current escort and convoy regulation', NOW()),
('HC-022', 'AT', 'Austria', 'National', 'national', 'official_permit_portal', 'undated', 'official', 76, 'https://www.asfinag.at/verkehr-sicherheit/lkw-bus/sondertransporte/', 'Sondertransporte', 'ASFINAG', 'de', 'special transport permit authority page', NOW()),
('HC-023', 'JP', 'Japan', 'National', 'national', 'official_operator_guide', '2020', 'official', 85, 'https://www.mlit.go.jp/road/tokusya/haitijoken/pdf/03.pdf', '特殊車両の通行に係る誘導等ガイドライン', 'Ministry of Land Infrastructure Transport and Tourism', 'ja', 'escort vehicle placement and operating guidance', NOW()),
('HC-024', 'JP', 'Japan', 'National', 'national', 'official_training_standard', '2020', 'official', 88, 'https://www.tokusya.ktr.mlit.go.jp/PR/pdf/videojuko-guide_202012.pdf', '特殊車両の通行に係る誘導等講習', 'Ministry of Land Infrastructure Transport and Tourism', 'ja', 'online escort training course guide', NOW()),
('HC-025', 'SG', 'Singapore', 'National', 'national', 'official_permit_portal', '2026', 'official', 83, 'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/commercial-vehicles.html', 'Commercial Vehicles', 'Land Transport Authority Singapore', 'en', 'OVM permit and auxiliary police escort thresholds', NOW()),
('HC-026', 'SG', 'Singapore', 'National', 'national', 'official_operator_guide', '2014', 'official', 80, 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/AHVMBrochure.pdf', 'AHVM Brochure', 'Land Transport Authority Singapore', 'en', 'oversized heavy vehicle movement brochure', NOW()),
('HC-027', 'BR', 'Brazil', 'National', 'national', 'official_operator_guide', '2020', 'official', 90, 'https://www.gov.br/prf/pt-br/assuntos/escolta-de-cargas/m-17-manual-carga-indivisivel', 'M-017 - Manual dos Serviços de Escolta de Cargas Indivisíveis e Superdimensionadas', 'Polícia Rodoviária Federal', 'pt', 'core escort manual', NOW()),
('HC-028', 'BR', 'Brazil', 'National', 'national', 'official_statute_or_regulation', '2023', 'official', 88, 'https://www.gov.br/prf/pt-br/seguranca-viaria/escolta-de-cargas/copy_of_SEI_PRF46288632PortariaNormativa.pdf', 'Portaria Normativa PRF nº 24 de 26 de janeiro de 2023', 'Polícia Rodoviária Federal', 'pt', 'current escort regulation', NOW()),
('HC-029', 'ZA', 'South Africa', 'National', 'national', 'official_permit_manual', '2010', 'official', 82, 'https://www.transport.gov.za/wp-content/uploads/2023/02/TRH11_AdministrativeGuidelines-1stEdition2010_Final_.pdf', 'TRH11 Administrative Guidelines for Granting Exemption Permits', 'Department of Transport South Africa', 'en', 'abnormal load permit framework', NOW()),
('HC-030', 'CL', 'Chile', 'National', 'national', 'official_permit_manual', '2023', 'official', 85, 'https://vialidad.mop.gob.cl/uploads/sites/9/2025/02/Manual_Autorizaciones_para_tansportes_especiales_v2023.pdf', 'Manual Autorizaciones para Transportes Especiales v2023', 'Dirección de Vialidad MOP', 'es', 'special transport permit manual', NOW()),
('HC-031', 'CL', 'Chile', 'National', 'national', 'official_permit_portal', '2026', 'official', 80, 'https://www.chileatiende.gob.cl/fichas/4429-autorizacion-para-que-vehiculos-con-sobrepeso-o-sobredimension-circulen-por-un-camino-publico', 'Autorización para vehículos con sobrepeso y/o sobredimensión', 'ChileAtiende / Dirección de Vialidad', 'es', 'public permit application guidance', NOW()),
('HC-032', 'CL', 'Chile', 'National', 'national', 'official_operator_guide', '2025', 'official', 78, 'https://vialidad.mop.gob.cl/uploads/sites/9/2025/11/Orientaciones-para-los-usuarios-de-servicios-de-escoltas-sobredimensionadas-2025.pdf', 'Orientaciones para los usuarios de servicios de escoltas sobredimensionadas 2025', 'Dirección de Vialidad MOP', 'es', 'escort service user guidance', NOW());
