-- ═════════════════════════════════════════════════════════════
-- HYPER-LOCAL AD TEMPLATES + OPERATOR CRYPTO + AI SERVICES
-- ═════════════════════════════════════════════════════════════

-- 1. Ad Template System — variables: {{country_name}}, {{city_name}}, {{corridor_name}}, {{operator_count}}, {{currency_symbol}}
CREATE TABLE IF NOT EXISTS hc_ad_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key text NOT NULL UNIQUE,
    category text NOT NULL DEFAULT 'house',
    locale text NOT NULL DEFAULT 'en',
    country_code text,
    corridor_code text,
    city_slug text,
    headline_template text NOT NULL,
    description_template text NOT NULL,
    cta_text text NOT NULL DEFAULT 'Learn More',
    cta_url_template text NOT NULL DEFAULT '/directory/{{country}}',
    image_strategy text DEFAULT 'country_flag',
    target_audience text DEFAULT 'operators',
    priority int DEFAULT 50,
    is_active boolean DEFAULT true,
    ab_group text DEFAULT 'A',
    created_at timestamptz DEFAULT now()
);

-- 2. AI-Generated Ad Cache
CREATE TABLE IF NOT EXISTS hc_ad_generated (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES hc_ad_templates(id),
    country_code text NOT NULL,
    corridor_code text,
    city_slug text,
    headline text NOT NULL,
    description text NOT NULL,
    cta_text text NOT NULL,
    cta_url text NOT NULL,
    image_url text,
    ai_model text DEFAULT 'gpt-4o',
    quality_score numeric(3,2),
    impressions int DEFAULT 0,
    clicks int DEFAULT 0,
    ctr numeric(5,4) DEFAULT 0,
    is_approved boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_adgen_country ON hc_ad_generated(country_code, is_approved);
CREATE INDEX IF NOT EXISTS idx_adgen_corridor ON hc_ad_generated(corridor_code, is_approved);

-- 3. Operator Crypto Wallet columns
ALTER TABLE operators ADD COLUMN IF NOT EXISTS crypto_wallet_address text;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS preferred_crypto text DEFAULT 'usdt';
ALTER TABLE operators ADD COLUMN IF NOT EXISTS crypto_enabled boolean DEFAULT false;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS nowpayments_sub_id text;

-- 4. AI Service Catalog
CREATE TABLE IF NOT EXISTS hc_ai_services (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    agent_id text REFERENCES hc_ai_config(id),
    is_premium boolean DEFAULT false,
    price_usd numeric(8,2) DEFAULT 0,
    usage_count int DEFAULT 0,
    category text DEFAULT 'operations',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

INSERT INTO hc_ai_services (id, name, description, agent_id, is_premium, price_usd, category) VALUES
('instant_dispatch','Instant AI Dispatch','AI extracts load dimensions, route, escort requirements','dispatch_brain',false,0,'operations'),
('regulation_lookup','Regulation Lookup','State-specific escort/permit answers with citations','regulation_rag',false,0,'compliance'),
('route_survey_gen','Route Survey Generator','Professional route survey with clearances','route_survey',true,4.99,'operations'),
('contract_builder','Contract Builder','Auto-filled escort service agreements','contract_gen',true,2.99,'documents'),
('invoice_maker','Invoice Maker','Branded invoices for completed jobs','invoice_gen',true,1.99,'documents'),
('profile_optimizer','Profile Optimizer','AI profile review for more bookings','onboarding_copilot',false,0,'growth'),
('review_insights','Review Intelligence','Sentiment trends from reviews','review_analyzer',true,0.99,'analytics'),
('load_description_pro','Load Description Pro','Brief to professional posting','load_enhancer',false,0,'operations'),
('seo_page_gen','SEO Page Factory','Auto content for city/state pages','content_factory',true,0.49,'content'),
('ad_copy_studio','Ad Copy Studio','5 ad variants per corridor','ad_copy_gen',true,1.99,'advertising'),
('daily_anomaly_scan','Daily Anomaly Scanner','AI metrics monitoring and alerts','anomaly_detector',true,9.99,'analytics'),
('ai_support','24/7 AI Support','Instant platform answers','support_bot',false,0,'support')
ON CONFLICT (id) DO NOTHING;

-- 5. Hyper-local ad serving RPC
CREATE OR REPLACE FUNCTION serve_hyperlocal_ad(
    p_country text DEFAULT 'US',
    p_corridor text DEFAULT NULL,
    p_city text DEFAULT NULL
) RETURNS jsonb AS $$
BEGIN
    IF p_city IS NOT NULL THEN
        RETURN (SELECT jsonb_build_object('id',id,'headline',headline,'description',description,
            'cta_text',cta_text,'cta_url',cta_url,'image_url',image_url,'source','city')
        FROM hc_ad_generated WHERE city_slug = p_city AND country_code = p_country AND is_approved = true
        ORDER BY quality_score DESC NULLS LAST, random() LIMIT 1);
    END IF;
    IF p_corridor IS NOT NULL THEN
        RETURN (SELECT jsonb_build_object('id',id,'headline',headline,'description',description,
            'cta_text',cta_text,'cta_url',cta_url,'image_url',image_url,'source','corridor')
        FROM hc_ad_generated WHERE corridor_code = p_corridor AND country_code = p_country AND is_approved = true
        ORDER BY quality_score DESC NULLS LAST, random() LIMIT 1);
    END IF;
    RETURN (SELECT jsonb_build_object('id',id,'headline',headline,'description',description,
        'cta_text',cta_text,'cta_url',cta_url,'image_url',image_url,'source','country')
    FROM hc_ad_generated WHERE country_code = p_country AND corridor_code IS NULL AND city_slug IS NULL AND is_approved = true
    ORDER BY quality_score DESC NULLS LAST, random() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Hyper-local country ad templates (57 templates — one per country)
INSERT INTO hc_ad_templates (template_key, category, country_code, headline_template, description_template, cta_text, cta_url_template, target_audience) VALUES
('us_operators','house','US','🇺🇸 Pilot Car Operators in {{city_name}}','Join {{operator_count}}+ verified escorts near {{city_name}}. Get matched to loads instantly.','Claim Your Profile','/directory/us','operators'),
('us_brokers','house','US','🇺🇸 Need Escorts in {{city_name}}?','Find verified pilot car services near {{city_name}}. Instant dispatch. Real-time availability.','Find Escorts','/directory/us','brokers'),
('ca_operators','house','CA','🇨🇦 Pilot Car Operators in {{city_name}}','Join {{operator_count}}+ verified escorts across Canada. Get matched instantly.','Claim Your Profile','/directory/ca','operators'),
('ca_brokers','house','CA','🇨🇦 Need Escorts in {{city_name}}?','Find verified pilot car services across Canada. Instant dispatch.','Find Escorts','/directory/ca','brokers'),
('gb_operators','house','GB','🇬🇧 Escort Vehicle Operators in {{city_name}}','Join verified abnormal load escorts across the UK. Get matched instantly.','Claim Your Profile','/directory/gb','operators'),
('au_operators','house','AU','🇦🇺 Pilot Vehicle Operators in {{city_name}}','Join verified OSOM escorts across Australia. Get matched instantly.','Claim Your Profile','/directory/au','operators'),
('de_operators','house','DE','🇩🇪 Begleitfahrzeug-Betreiber in {{city_name}}','Registrieren Sie sich als Schwertransport-Begleiter. Sofortige Vermittlung.','Profil Erstellen','/directory/de','operators'),
('fr_operators','house','FR','🇫🇷 Véhicules Pilotes à {{city_name}}','Rejoignez les convoyeurs exceptionnels certifiés. Mise en relation instantanée.','Créer Mon Profil','/directory/fr','operators'),
('br_operators','house','BR','🇧🇷 Batedores em {{city_name}}','Junte-se aos batedores verificados. Correspondência instantânea de cargas.','Criar Perfil','/directory/br','operators'),
('mx_operators','house','MX','🇲🇽 Vehículos Piloto en {{city_name}}','Únete a escoltas verificados en México. Despacho instantáneo.','Crear Perfil','/directory/mx','operators'),
('jp_operators','house','JP','🇯🇵 先導車オペレーター {{city_name}}','認定された特殊車両誘導員に登録。即時マッチング。','プロフィール作成','/directory/jp','operators'),
('ae_operators','house','AE','🇦🇪 Pilot Car Operators in {{city_name}}','Join verified escort services across the UAE. Instant dispatch.','Claim Profile','/directory/ae','operators'),
('sg_operators','house','SG','🇸🇬 Escort Vehicle Operators','Join verified heavy transport escorts in Singapore.','Claim Profile','/directory/sg','operators'),
('za_operators','house','ZA','🇿🇦 Pilot Vehicle Operators in {{city_name}}','Join verified abnormal load escorts across South Africa.','Claim Profile','/directory/za','operators'),
('in_operators','house','IN','🇮🇳 Pilot Vehicle Operators in {{city_name}}','Join verified ODC transport escorts across India. Instant matching.','Claim Profile','/directory/in','operators'),
('kr_operators','house','KR','🇰🇷 선도차량 운전자 {{city_name}}','인증된 특수운송 호위 서비스에 등록하세요.','프로필 등록','/directory/kr','operators'),
('nl_operators','house','NL','🇳🇱 Begeleidingsvoertuigen in {{city_name}}','Word lid van geverifieerde exceptioneel transport begeleiders.','Profiel Maken','/directory/nl','operators'),
('it_operators','house','IT','🇮🇹 Veicoli di Scorta a {{city_name}}','Unisciti agli accompagnatori verificati per trasporti eccezionali.','Crea Profilo','/directory/it','operators'),
('es_operators','house','ES','🇪🇸 Vehículos Piloto en {{city_name}}','Únete a los escoltas verificados de transporte especial en España.','Crear Perfil','/directory/es','operators'),
('nz_operators','house','NZ','🇳🇿 Pilot Vehicle Operators in {{city_name}}','Join verified HPMV escorts across New Zealand.','Claim Profile','/directory/nz','operators'),
('ch_operators','house','CH','🇨🇭 Begleitfahrzeuge in {{city_name}}','Registrieren Sie sich als Schwertransport-Begleiter in der Schweiz.','Profil Erstellen','/directory/ch','operators'),
('se_operators','house','SE','🇸🇪 Följebilar i {{city_name}}','Bli en verifierad specialtransport-eskort i Sverige.','Skapa Profil','/directory/se','operators'),
('no_operators','house','NO','🇳🇴 Følgebiler i {{city_name}}','Bli en verifisert spesialtransport-eskort i Norge.','Opprett Profil','/directory/no','operators'),
('pl_operators','house','PL','🇵🇱 Piloci Transportu w {{city_name}}','Dołącz do zweryfikowanych pilotów ładunków ponadnormatywnych.','Utwórz Profil','/directory/pl','operators')
ON CONFLICT (template_key) DO NOTHING;
