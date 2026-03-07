-- ============================================================================
-- HAUL COMMAND — COMMS TEMPLATES LOCALIZATION + DNC LIST
-- Supports ListMonk translation matrix + outbound DNC management
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A) COMMS TEMPLATES LOCALIZED
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comms_templates_localized (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key    text        NOT NULL,   -- 'claim_start', 'verification_steps', etc.
    locale          text        NOT NULL,   -- 'en', 'en-US', 'de-DE', 'sv-SE', etc.
    channel         text        NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push')),
    
    -- Content
    subject         text,                   -- email subject (null for SMS/push)
    body_html       text,                   -- HTML body for email
    body_text       text        NOT NULL,   -- Plain text body (required: fallback + SMS)
    
    -- Quality control
    is_reviewed     boolean     DEFAULT false,
    has_mixed_lang  boolean     DEFAULT false,  -- flag for bad translations
    reviewer_notes  text,
    
    -- Metadata
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    
    UNIQUE(template_key, locale, channel)
);

CREATE INDEX IF NOT EXISTS idx_comms_tpl_key ON public.comms_templates_localized(template_key);
CREATE INDEX IF NOT EXISTS idx_comms_tpl_locale ON public.comms_templates_localized(locale);

ALTER TABLE public.comms_templates_localized ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comms_tpl_service_all" ON public.comms_templates_localized FOR ALL USING (auth.role() = 'service_role');

-- Seed English templates for all 7 required sequences
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    -- claim_start
    ('claim_start', 'en', 'email',
     'Claim Your Free Listing on Haul Command',
     'Hi {{contact_name}},\n\nSomeone from Haul Command just called about your listing for {{business_name}}. You can claim it for free here:\n\n{{claim_url}}\n\nThis gives you control of your listing — update hours, add photos, and see how many drivers found you this week.\n\nNo credit card required.\n\n— The Haul Command Team'),
    ('claim_start', 'en', 'sms',
     NULL,
     'Haul Command: Claim your free listing for {{business_name}}: {{claim_url}} — Reply STOP to opt out'),

    -- claim_incomplete_reminder
    ('claim_incomplete_reminder', 'en', 'email',
     'Your Haul Command listing is waiting',
     'Hi {{contact_name}},\n\nYou started claiming {{business_name}} on Haul Command but didn''t finish. Pick up where you left off:\n\n{{claim_url}}\n\nIt takes less than 60 seconds.\n\n— Haul Command'),

    -- verification_steps
    ('verification_steps', 'en', 'email',
     'Verify Your Listing — Next Steps',
     'Hi {{contact_name}},\n\nTo complete your claim for {{business_name}}, we need to verify you''re authorized.\n\n{{#if method_phone}}We sent a 6-digit code to {{phone_number}}. Enter it here: {{verify_url}}{{/if}}\n{{#if method_email}}Click this link to verify: {{verify_url}}{{/if}}\n{{#if method_dns}}Add this TXT record to your DNS: {{dns_token}}{{/if}}\n\nThis code expires in 15 minutes.\n\n— Haul Command'),

    -- verified_success
    ('verified_success', 'en', 'email',
     '✅ Your Listing is Verified!',
     'Hi {{contact_name}},\n\nCongratulations! {{business_name}} is now verified on Haul Command.\n\nYour listing: {{listing_url}}\n\nWhat you can do now:\n- Add photos and update your description\n- See visitor stats on your dashboard\n- Respond to reviews from drivers\n\nWant to stand out more? Upgrade to Premium for priority placement: {{upgrade_url}}\n\n— Haul Command'),

    -- premium_offer
    ('premium_offer', 'en', 'email',
     'Get More Drivers to {{business_name}}',
     'Hi {{contact_name}},\n\nYour listing for {{business_name}} got {{views_count}} views in the last 7 days. Drivers are finding you.\n\nWith Premium placement ($49/mo), you''d show up first when brokers and drivers search your area:\n\n{{upgrade_url}}\n\n- Priority search ranking\n- Featured badge on your listing\n- Monthly traffic report\n- Cancel anytime\n\n— Haul Command'),

    -- adgrid_offer
    ('adgrid_offer', 'en', 'email',
     'Your Traffic Report + AdGrid Opportunity',
     'Hi {{contact_name}},\n\n{{business_name}} stats this week:\n- {{views_count}} listing views\n- {{search_impressions}} search appearances\n- Top corridor: {{top_corridor}}\n\nWith AdGrid Boost ($99/mo), your brand appears on every corridor page in your area. Based on your traffic, you could see ~{{est_leads}} new contacts per month.\n\n{{adgrid_url}}\n\n— Haul Command'),

    -- opt_out_confirmation
    ('opt_out_confirmation', 'en', 'email',
     'You''ve Been Removed from Haul Command Calls',
     'Hi,\n\nAs requested, we''ve removed your number from our call list. You will not receive any more calls from Haul Command.\n\nYour free listing at haulcommand.com is unaffected and will continue to help drivers find your business.\n\nIf you ever want to take control of your listing: {{claim_url}}\n\n— Haul Command'),
    ('opt_out_confirmation', 'en', 'sms',
     NULL,
     'Haul Command: You''ve been removed from our call list. Your free listing is unaffected. Visit haulcommand.com anytime.')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- Seed German (de) templates
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    ('claim_start', 'de', 'email',
     'Beanspruchen Sie Ihren kostenlosen Eintrag bei Haul Command',
     'Hallo {{contact_name}},\n\nJemand von Haul Command hat Sie bezüglich Ihres Eintrags für {{business_name}} kontaktiert. Beanspruchen Sie ihn kostenlos hier:\n\n{{claim_url}}\n\nKeine Kreditkarte erforderlich.\n\n— Das Haul Command Team'),
    ('verified_success', 'de', 'email',
     '✅ Ihr Eintrag ist verifiziert!',
     'Hallo {{contact_name}},\n\nHerzlichen Glückwunsch! {{business_name}} ist jetzt bei Haul Command verifiziert.\n\nIhr Eintrag: {{listing_url}}\n\n— Haul Command'),
    ('opt_out_confirmation', 'de', 'email',
     'Sie wurden von Haul Command Anrufen entfernt',
     'Hallo,\n\nWie gewünscht haben wir Ihre Nummer von unserer Anrufliste entfernt.\n\nIhr kostenloser Eintrag bleibt davon unberührt.\n\n— Haul Command')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- Seed Swedish (sv) templates
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    ('claim_start', 'sv', 'email',
     'Gör anspråk på din gratis annons på Haul Command',
     'Hej {{contact_name}},\n\nNågon från Haul Command ringde om din annons för {{business_name}}. Du kan göra anspråk på den gratis här:\n\n{{claim_url}}\n\nInget kreditkort krävs.\n\n— Haul Command'),
    ('opt_out_confirmation', 'sv', 'email',
     'Du har tagits bort från Haul Commands samtalslista',
     'Hej,\n\nSom begärt har vi tagit bort ditt nummer från vår samtalslista.\n\n— Haul Command')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- Seed Norwegian (no) templates
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    ('claim_start', 'no', 'email',
     'Gjør krav på din gratis oppføring på Haul Command',
     'Hei {{contact_name}},\n\nNoen fra Haul Command ringte angående oppføringen din for {{business_name}}. Du kan gjøre krav på den gratis her:\n\n{{claim_url}}\n\nIngen kredittkort nødvendig.\n\n— Haul Command'),
    ('opt_out_confirmation', 'no', 'email',
     'Du er fjernet fra Haul Commands ringeliste',
     'Hei,\n\nSom forespurt har vi fjernet nummeret ditt fra vår ringeliste.\n\n— Haul Command')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- Seed Spanish (es) templates — for ES, MX, CL
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    ('claim_start', 'es', 'email',
     'Reclame su listado gratuito en Haul Command',
     'Hola {{contact_name}},\n\nAlguien de Haul Command le llamó sobre su listado de {{business_name}}. Puede reclamarlo gratis aquí:\n\n{{claim_url}}\n\nNo se requiere tarjeta de crédito.\n\n— El equipo de Haul Command'),
    ('opt_out_confirmation', 'es', 'email',
     'Ha sido eliminado de las llamadas de Haul Command',
     'Hola,\n\nComo solicitó, hemos eliminado su número de nuestra lista de llamadas.\n\n— Haul Command')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- Seed Portuguese (pt) templates — for BR
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    ('claim_start', 'pt', 'email',
     'Reivindique sua listagem gratuita no Haul Command',
     'Olá {{contact_name}},\n\nAlguém do Haul Command ligou sobre sua listagem de {{business_name}}. Você pode reivindicá-la gratuitamente aqui:\n\n{{claim_url}}\n\nNenhum cartão de crédito necessário.\n\n— Equipe Haul Command'),
    ('opt_out_confirmation', 'pt', 'email',
     'Você foi removido das chamadas do Haul Command',
     'Olá,\n\nConforme solicitado, removemos seu número de nossa lista de chamadas.\n\n— Haul Command')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- Seed Arabic (ar) templates — for SA, AE
INSERT INTO public.comms_templates_localized (template_key, locale, channel, subject, body_text) VALUES
    ('claim_start', 'ar', 'email',
     'اطلب قائمتك المجانية في Haul Command',
     'مرحبًا {{contact_name}},\n\nاتصل بك شخص من Haul Command بشأن قائمتك لـ {{business_name}}. يمكنك المطالبة بها مجانًا هنا:\n\n{{claim_url}}\n\nلا حاجة لبطاقة ائتمان.\n\n— فريق Haul Command'),
    ('opt_out_confirmation', 'ar', 'email',
     'تمت إزالتك من قائمة مكالمات Haul Command',
     'مرحبًا,\n\nكما طلبت، أزلنا رقمك من قائمة المكالمات.\n\n— Haul Command')
ON CONFLICT (template_key, locale, channel) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- B) OUTBOUND DNC LIST
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.outbound_dnc_list (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    phone           text        NOT NULL,
    entity_id       uuid,
    entity_type     text,
    country_code    text,
    opted_out_at    timestamptz DEFAULT now(),
    source          text        DEFAULT 'voice' CHECK (source IN ('voice', 'sms', 'email', 'web', 'manual')),
    
    UNIQUE(phone)
);

CREATE INDEX IF NOT EXISTS idx_dnc_phone ON public.outbound_dnc_list(phone);

ALTER TABLE public.outbound_dnc_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dnc_service_all" ON public.outbound_dnc_list FOR ALL USING (auth.role() = 'service_role');

-- ════════════════════════════════════════════════════════════════
-- C) COMPLIANCE EVENTS LOG
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.compliance_events (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type      text        NOT NULL CHECK (event_type IN (
        'opt_out', 'hostile_opt_out', 'recording_refused',
        'quiet_hours_violation', 'dnc_hit', 'disclosure_delivered',
        'country_unlocked', 'country_suspended'
    )),
    entity_id       uuid,
    entity_type     text,
    country_code    text,
    call_id         text,
    details         jsonb       DEFAULT '{}',
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON public.compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_country ON public.compliance_events(country_code);

ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_events_service_all" ON public.compliance_events FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT ON public.comms_templates_localized TO authenticated;
GRANT SELECT ON public.compliance_events TO authenticated;
