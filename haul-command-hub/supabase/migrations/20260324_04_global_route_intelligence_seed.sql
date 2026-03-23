CREATE TABLE IF NOT EXISTS country_regulations (
    country_code VARCHAR(2) PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    max_routine_width_meters NUMERIC(5,2),
    max_routine_height_meters NUMERIC(5,2),
    max_routine_length_meters NUMERIC(5,2),
    max_routine_weight_kg INTEGER,
    escort_required_width_meters NUMERIC(5,2),
    standard_curfews_apply BOOLEAN,
    night_moves_allowed BOOLEAN,
    metric_standard BOOLEAN DEFAULT true,
    transport_authority_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: These values represent general, maximum routine permit limits prior to specialized engineering or "Superload" classification.
-- Limits vary greatly by province/state within countries (e.g., US, Canada, Australia). 
-- Widths over typically ~3.0m - 3.5m require escorts universally.

INSERT INTO country_regulations (
    country_code, country_name, max_routine_width_meters, max_routine_height_meters, 
    max_routine_length_meters, max_routine_weight_kg, escort_required_width_meters, 
    standard_curfews_apply, night_moves_allowed, metric_standard, transport_authority_notes
) VALUES
('US', 'United States', 4.88, 4.88, 45.72, 68038, 3.66, true, true, false, 'State regulations dominate. Federally mandated baseline limits apply to interstate networks.'),
('CA', 'Canada', 5.00, 4.88, 40.00, 70000, 3.85, true, true, true, 'Heavily driven by seasonal thaw restrictions (spring weight limits). Western provinces differ aggressively from Eastern.'),
('MX', 'Mexico', 4.00, 4.25, 31.00, 75000, 3.50, false, false, true, 'Secretariat of Communications and Transportation (SCT) manages NOM-012 standards. Escorts required for almost all OSOW.'),
('GB', 'United Kingdom', 4.30, 4.95, 30.00, 80000, 3.50, true, true, true, 'STGO (Special Types General Order) applies. High loads restricted heavily by historic bridges/tunnels.'),
('DE', 'Germany', 4.00, 4.50, 35.00, 100000, 3.20, true, true, true, 'VEMAGS system for digital permitting. Weekend/Sunday travel categorically prohibited except for emergency.'),
('FR', 'France', 4.00, 4.50, 35.00, 120000, 3.50, true, false, true, 'Categories 1, 2, and 3 define permit rules via Cerfa forms. Gendarmes often required for highest categories.'),
('IT', 'Italy', 4.00, 4.30, 30.50, 108000, 3.20, true, false, true, '"Trasporti Eccezionali". Autostrade requires separate permits from local municipalities.'),
('ES', 'Spain', 4.00, 4.50, 35.00, 100000, 3.00, true, false, true, 'Dirección General de Tráfico (DGT). Strict daytime routing. High sun/summer curfews apply.'),
('AU', 'Australia', 5.50, 5.00, 40.00, 150000, 3.50, false, true, true, 'Varies heavily by state (WA vs QLD). Road trains allowed massive unpermitted limits in outback.'),
('NZ', 'New Zealand', 4.50, 4.80, 25.00, 80000, 3.10, true, false, true, '"Overdimension" permits managed by Waka Kotahi. Pilot vehicles are heavily categorized (Class 1, 2).'),
('BR', 'Brazil', 3.80, 4.70, 30.00, 74000, 3.20, true, false, true, 'DNIT manages federal highways. Daylight travel only for extreme dimensions.'),
('AR', 'Argentina', 3.50, 4.30, 25.00, 60000, 3.00, true, false, true, 'Vialidad Nacional oversees. Difficult mountain routes restrict physical combinations.'),
('ZA', 'South Africa', 3.50, 4.80, 26.00, 70000, 3.20, true, false, true, 'Abnormal load exemptions via TRH 11 guidelines. Clearance heavily monitored on N1/N2/N3.'),
('JP', 'Japan', 3.30, 4.10, 21.00, 44000, 3.00, true, true, true, 'Extremely tight infrastructure. Highest density of "night-move only" regulations for OSOW globally.'),
('CN', 'China', 4.00, 4.50, 30.00, 100000, 3.50, false, true, true, 'Ministry of Transport. "San Chao" (Three Supers) governs overweight/oversize logistics.'),
('IN', 'India', 3.50, 4.50, 25.00, 80000, 3.00, false, false, true, 'MoRTH guidelines. Infrastructure limits are physical rather than strictly regulatory in many regions.'),
('AE', 'United Arab Emirates', 4.50, 5.00, 30.00, 100000, 3.50, true, true, true, 'Police escorts required natively for almost all abnormal loads across Emirates.'),
('SA', 'Saudi Arabia', 4.00, 4.80, 30.00, 90000, 3.30, true, true, true, 'Ministry of Transport. Broad infrastructure allows significant heavy haul logistics for oil/gas.'),
('NL', 'Netherlands', 4.00, 4.50, 35.00, 100000, 3.50, true, true, true, 'RDW manages permits. "Ontheffing" required. Frequent night moves.'),
('BE', 'Belgium', 4.00, 4.50, 35.00, 120000, 3.50, true, true, true, 'Regional limits govern (Flanders vs Wallonia). Complex integration required.'),
('SE', 'Sweden', 4.50, 4.80, 30.00, 100000, 3.50, false, true, true, 'Trafikverket limits. Very progressive heavy-combination limits via BK1/BK2 classifications.'),
('NO', 'Norway', 3.50, 4.50, 25.00, 65000, 3.00, true, true, true, 'Statens vegvesen. Fjords and tunnel networks restrict height and length aggressively.'),
('FI', 'Finland', 4.00, 4.50, 34.50, 76000, 3.50, false, true, true, 'High winter gross limits compared to southern Europe.'),
('DK', 'Denmark', 4.00, 4.50, 30.00, 100000, 3.50, true, false, true, 'Vejdirektoratet manages. Strict adherence to bridge loading classes.'),
('PL', 'Poland', 4.00, 4.50, 30.00, 80000, 3.20, true, true, true, 'GDDKiA limits. Highly active central corridor for European transit.'),
('CZ', 'Czech Republic', 4.00, 4.50, 30.00, 80000, 3.20, true, false, true, 'Strict routing around Prague ring and historic infrastructure.'),
('AT', 'Austria', 4.00, 4.50, 30.00, 80000, 3.20, true, true, true, 'ASFINAG controls network. Alpine routing necessitates extensive structural calculations.'),
('CH', 'Switzerland', 3.50, 4.20, 25.00, 60000, 3.00, true, true, true, 'Extremely restrictive. Weight drops severely on mountain passes. "Ausnahmetransport" requires direct Canton clearance.'),
('IE', 'Ireland', 4.00, 4.65, 30.00, 80000, 3.00, true, false, true, 'Notice must be given to Garda Siochana. Tight rural roads restrict access globally.'),
('PT', 'Portugal', 4.00, 4.50, 30.00, 80000, 3.00, true, false, true, 'IMT oversees via "Autorização Especial de Trânsito".'),
('TR', 'Turkey', 4.00, 4.50, 30.00, 80000, 3.00, true, true, true, 'KGM limits. Active transit corridor between Europe and Asia.'),
('GR', 'Greece', 3.50, 4.30, 25.00, 60000, 3.00, true, false, true, 'Road topology severely restricts major haulage, especially on islands.'),
('RO', 'Romania', 4.00, 4.50, 30.00, 80000, 3.50, true, false, true, 'CNAIR controls network via AST permits.'),
('HU', 'Hungary', 4.00, 4.50, 30.00, 80000, 3.50, true, false, true, 'Bi-K-A framework. Transit restrictions over weekends.'),
('RU', 'Russia', 4.50, 4.80, 35.00, 100000, 3.50, false, true, true, 'Federal Highway Agency (Rosavtodor). Regional variables extremely wide.'),
('PK', 'Pakistan', 3.50, 4.50, 25.00, 80000, 3.00, false, false, true, 'NHA restrictions heavily reliant on escort arrangements privately.'),
('BD', 'Bangladesh', 3.00, 4.20, 20.00, 50000, 3.00, false, false, true, 'Bridge infrastructure heavily restricts overweight payloads crossing river systems.'),
('TW', 'Taiwan', 3.50, 4.30, 25.00, 60000, 3.00, true, true, true, 'Highway Bureau restricts. Heavy daytime curfews in Taipei metro.'),
('KR', 'South Korea', 3.50, 4.30, 25.00, 60000, 3.00, true, true, true, 'MOLIT. Tunnel height limits strictly enforced across mountainous terrains.'),
('ID', 'Indonesia', 3.50, 4.50, 25.00, 60000, 3.00, false, false, true, 'Island constraints and limited wide-axle networks.'),
('MY', 'Malaysia', 4.00, 4.50, 30.00, 80000, 3.50, true, true, true, 'JPJ routing. Night moves preferred in Klang Valley.'),
('SG', 'Singapore', 4.00, 4.50, 30.00, 80000, 3.00, true, true, true, 'LTA regulates. Auxiliary police escorts required heavily due to density.'),
('TH', 'Thailand', 4.00, 4.50, 30.00, 80000, 3.50, true, false, true, 'Department of Highways (DOH) standardizes limits.'),
('VN', 'Vietnam', 3.50, 4.30, 25.00, 60000, 3.00, true, false, true, 'DRVN restricts based strictly on road grading.'),
('PH', 'Philippines', 3.50, 4.30, 25.00, 60000, 3.00, true, false, true, 'DPWH enforces anti-overloading laws. Metro Manila enforces tight curfews.'),
('CO', 'Colombia', 3.50, 4.30, 25.00, 60000, 3.00, true, false, true, 'INVIAS controls. Andean topology governs practical maximums.'),
('CL', 'Chile', 4.00, 4.50, 30.00, 80000, 3.00, true, false, true, 'Vialidad permits common for mining mega-loads in North.'),
('PE', 'Peru', 3.50, 4.30, 25.00, 60000, 3.00, true, false, true, 'SUTRAN oversight. Andean passes limit physical hauling severely.'),
('EG', 'Egypt', 4.00, 4.50, 30.00, 80000, 3.00, false, true, true, 'GARB regulations. Military escorts required for specific classes.'),
('NG', 'Nigeria', 3.50, 4.50, 25.00, 70000, 3.00, false, false, true, 'FRSC regulations limit extreme movements without direct police backing.'),
('KE', 'Kenya', 3.50, 4.50, 25.00, 60000, 3.00, true, false, true, 'KeNHA axle load limits are heavily enforced via weighbridge network.'),
('MA', 'Morocco', 3.50, 4.50, 25.00, 60000, 3.00, true, false, true, 'Autoroutes du Maroc controls dimensions.'),
('DZ', 'Algeria', 3.50, 4.50, 25.00, 60000, 3.00, true, false, true, 'Mining/energy heavy equipment permits granted directly via MoT.'),
('IS', 'Iceland', 3.50, 4.30, 25.00, 60000, 3.00, false, false, true, 'Vegagerdin manages limits. High wind restricts movements dramatically.'),
('IL', 'Israel', 4.00, 4.50, 30.00, 80000, 3.00, true, true, true, 'Netivei Israel restricts daytime movement heavily due to density.'),
('QA', 'Qatar', 4.00, 4.80, 30.00, 80000, 3.00, true, true, true, 'Ashghal regulates traffic network. Night moving heavily prioritized.')
ON CONFLICT (country_code) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    max_routine_width_meters = EXCLUDED.max_routine_width_meters,
    max_routine_height_meters = EXCLUDED.max_routine_height_meters,
    max_routine_length_meters = EXCLUDED.max_routine_length_meters,
    max_routine_weight_kg = EXCLUDED.max_routine_weight_kg,
    escort_required_width_meters = EXCLUDED.escort_required_width_meters,
    standard_curfews_apply = EXCLUDED.standard_curfews_apply,
    night_moves_allowed = EXCLUDED.night_moves_allowed,
    metric_standard = EXCLUDED.metric_standard,
    transport_authority_notes = EXCLUDED.transport_authority_notes,
    updated_at = NOW();

-- Setup RLS policy to ensure this reference intelligence remains secure but accessible to calculations.
ALTER TABLE IF EXISTS country_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Aggregate Route DB Analytics" ON country_regulations FOR SELECT USING (true);
CREATE POLICY "System Edit Country Settings" ON country_regulations FOR ALL USING (current_user = 'postgres');
