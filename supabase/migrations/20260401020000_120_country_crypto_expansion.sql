-- ==============================================================================
-- HAUL COMMAND - 120 COUNTRY CRYPTO LEGALITY EXPANSION
-- Wires up the remaining 63 countries into the hc_crypto_legality matrix
-- Defines exact Cardano (ADA) and Bitcoin (BTC) legality scopes per region
-- ==============================================================================

-- Ensure table structure exists if it was somehow skipped, though it already exists.
CREATE TABLE IF NOT EXISTS public.hc_crypto_legality (
    country_code VARCHAR(2) PRIMARY KEY,
    crypto_status VARCHAR(50) DEFAULT 'legal' CHECK (crypto_status IN ('legal', 'restricted', 'banned')),
    stablecoin_ok BOOLEAN DEFAULT true,
    btc_ok BOOLEAN DEFAULT true,
    eth_ok BOOLEAN DEFAULT true,
    ada_ok BOOLEAN DEFAULT true, -- added ADA specific compliance flag
    requires_kyc BOOLEAN DEFAULT true,
    notes TEXT,
    regulatory_body VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Note: We add `ada_ok` column to formally track Cardano compliance alongside btc_ok and eth_ok.
ALTER TABLE public.hc_crypto_legality ADD COLUMN IF NOT EXISTS ada_ok BOOLEAN DEFAULT true;

-- Seed the missing 63 major markets to hit the 120-country global target.
INSERT INTO public.hc_crypto_legality (
    country_code, crypto_status, stablecoin_ok, btc_ok, eth_ok, ada_ok, requires_kyc, notes, regulatory_body
) VALUES
-- European Union Block (MiCA Framework Compliant)
('FR', 'legal', true, true, true, true, true, 'Fully legal under MiCA regulations. Strong ADA/BTC liquidity.', 'AMF'),
('DE', 'legal', true, true, true, true, true, 'Legal. Crypto seen as private money. Escrow compliant.', 'BaFin'),
('IT', 'legal', true, true, true, true, true, 'Legal under MiCA. Subcontractor payment allowed.', 'OAM'),
('ES', 'legal', true, true, true, true, true, 'Legal. Must adhere to strict KYC for B2B payouts.', 'CNMV'),
('NL', 'legal', true, true, true, true, true, 'Legal. Extensive blockchain integration in Dutch logistics.', 'DNB'),
('BE', 'legal', true, true, true, true, true, 'Legal. Permitted for cross-border freight.', 'FSMA'),
('SE', 'legal', true, true, true, true, true, 'Legal. Crypto profits subject to capital gains.', 'FSA'),
('PT', 'legal', true, true, true, true, true, 'Legal. Historically crypto-friendly jurisdiction.', 'Banco de Portugal'),
('PL', 'legal', true, true, true, true, true, 'Legal. High adoption among Eastern European fleets.', 'KNF'),
('IE', 'legal', true, true, true, true, true, 'Legal. EU tech hub, fully MiCA compliant.', 'Central Bank of Ireland'),
('DK', 'legal', true, true, true, true, true, 'Legal. Highly regulated B2B payment rails.', 'DFSA'),
('FI', 'legal', true, true, true, true, true, 'Legal. Regulated under virtual currency provider act.', 'FIN-FSA'),
('AT', 'legal', true, true, true, true, true, 'Legal. High trust in stablecoin escrows.', 'FMA'),
('GR', 'legal', true, true, true, true, true, 'Legal. MiCA compliance required for brokers.', 'HCMC'),
('CZ', 'legal', true, true, true, true, true, 'Legal. Czech Republic is highly active in crypto-freight.', 'CNB'),

-- Rest of Europe
('CH', 'legal', true, true, true, true, true, 'Highly crypto-friendly (Crypto Valley). Global standard.', 'FINMA'),
('NO', 'legal', true, true, true, true, true, 'Legal. High alignment with EU standards despite non-EU status.', 'FSA Norway'),
('TR', 'restricted', true, true, true, true, true, 'Restricted: Payments for goods/services technically banned, but B2B holding allowed. Review needed.', 'CBRT'),
('UA', 'legal', true, true, true, true, true, 'Legal. High adoption for cross-border logistics during reconstruction.', 'NBU'),

-- LatAm (High relevance for Cross-Border Logistics routing)
('BR', 'legal', true, true, true, true, true, 'Legal. Massive adoption. Pix/Crypto rails fully active.', 'BCB'),
('MX', 'restricted', true, false, false, false, true, 'Restricted: Financial institutions cannot deal crypto, but B2B peer-to-peer is a grey area. (Stablecoins preferred over ADA/BTC)', 'Banxico'),
('AR', 'legal', true, true, true, true, false, 'Legal. Heavily utilized due to fiat inflation. Perfect use-case for NOWPayments.', 'CNV'),
('CO', 'legal', true, true, true, true, true, 'Legal. Active fintech regulatory sandbox in effect.', 'SFC'),
('CL', 'legal', true, true, true, true, true, 'Legal. Stable framework for B2B logistics transfers.', 'CMF'),
('PE', 'legal', true, true, true, true, true, 'Legal. Growing adoption in LatAm corridors.', 'SBS'),

-- Asia/Pacific 
('JP', 'legal', true, true, true, true, true, 'Legal. Highly regulated, approved tokens list required. (ADA, BTC fully approved).', 'FSA Japan'),
('SG', 'legal', true, true, true, true, true, 'Legal. Global fintech hub. Ideal for oceanic-to-freight payments.', 'MAS'),
('KR', 'legal', true, true, true, true, true, 'Legal. Very strict KYC required (Travel Rule).', 'FSC'),
('IN', 'restricted', true, true, true, true, true, 'Restricted: Heavy 30% tax on crypto, heavily regulated. Proceed with caution on escrows.', 'RBI'),
('ID', 'restricted', true, true, true, true, true, 'Restricted: Traded as commodity, NOT legal tender for direct payments. Must route to fiat.', 'Bappebti'),
('MY', 'legal', true, true, true, true, true, 'Legal. Regulated as digital assets. Permitted for smart contracts.', 'SC Malaysia'),
('TH', 'restricted', true, true, true, true, true, 'Restricted: Using crypto as a means of payment is banned by SEC Thailand. Escrow holding only.', 'SEC Thailand'),
('VN', 'restricted', true, true, true, true, true, 'Restricted: Issuance/use of crypto for payments is illegal, but holding is not.', 'SBV'),
('PH', 'legal', true, true, true, true, true, 'Legal. Favorable environment for inbound logistics remittances.', 'BSP'),
('TW', 'legal', true, true, true, true, true, 'Legal. Moving toward strict VASP regulatory framework.', 'FSC Taiwan'),
('HK', 'legal', true, true, true, true, true, 'Legal. Institutional grade crypto hub.', 'SFC Hong Kong'),

-- Middle East & Africa
('AE', 'legal', true, true, true, true, true, 'Legal/Encouraged. Dubai is a primary global crypto hub. Very favorable.', 'VARA'),
('SA', 'restricted', false, false, false, false, true, 'Restricted: Official ban on crypto handling by banks.', 'SAMA'),
('IL', 'legal', true, true, true, true, true, 'Legal. Classified as asset, full KYC required.', 'ISA'),
('ZA', 'legal', true, true, true, true, true, 'Legal. Classified as financial product.', 'FSCA'),
('NG', 'restricted', true, true, true, true, true, 'Restricted: Bank bans recently lifted. Highly volatile but massive adoption.', 'CBN'),
('KE', 'legal', true, true, true, true, true, 'Legal. Rapid adoption in logistics and mobile money.', 'CMA Kenya'),

-- Batch 3 (Filling out the 63 remaining)
('MA', 'banned', false, false, false, false, false, 'Crypto officially banned for transactions.', 'Office des Changes'),
('EG', 'banned', false, false, false, false, false, 'Crypto officially banned by Islamic decree and Central Bank.', 'CBE'),
('DZ', 'banned', false, false, false, false, false, 'Banned. No crypto transactions allowed.', 'Bank of Algeria'),
('BD', 'banned', false, false, false, false, false, 'Banned. Severe penalties for crypto utilization.', 'Bangladesh Bank'),
('PK', 'restricted', true, false, false, false, true, 'Highly restricted regulatory environment.', 'SBP'),
('NZ', 'legal', true, true, true, true, true, 'Legal. Classified as property. (May already exist, safe insert).', 'FMA'),
('IS', 'legal', true, true, true, true, true, 'Legal. Heavily mined region.', 'FSA Iceland'),
('CR', 'legal', true, true, true, true, true, 'Legal. Used in Central American logistics.', 'SUGEF'),
('PA', 'legal', true, true, true, true, true, 'Legal. Massive cross-border shipping hub (Panama Canal).', 'Superintendencia'),
('UY', 'legal', true, true, true, true, true, 'Legal. Advanced LatAm adoption.', 'BCU'),
('EE', 'legal', true, true, true, true, true, 'Legal. First mover in e-residency and crypto logistics.', 'FIU'),
('LT', 'legal', true, true, true, true, true, 'Legal. Massive VASP registration hub in EU.', 'Bank of Lithuania'),
('LV', 'legal', true, true, true, true, true, 'Legal. EU compliant framework.', 'FCMC'),
('MT', 'legal', true, true, true, true, true, 'Legal. The Blockchain Island.', 'MFSA'),
('CY', 'legal', true, true, true, true, true, 'Legal. Major broker hub.', 'CySEC'),
('LU', 'legal', true, true, true, true, true, 'Legal. Institutional stronghold.', 'CSSF'),
('GE', 'legal', true, true, true, true, true, 'Legal. Heavily utilized transit corridor between Europe and Asia.', 'NBG'),
('KZ', 'restricted', true, true, true, true, true, 'Restricted to AIFC hub, but heavily active in mining.', 'AFSA'),
('UZ', 'legal', true, true, true, true, true, 'Legal, heavily regulated framework for exchanges.', 'NAPP'),
('QA', 'banned', false, false, false, false, false, 'Banned by financial center.', 'QFCRA'),
('KW', 'banned', false, false, false, false, false, 'Banned by Ministry of Commerce.', 'CBK')

ON CONFLICT (country_code) DO UPDATE 
SET 
  crypto_status = EXCLUDED.crypto_status,
  ada_ok = EXCLUDED.ada_ok,
  notes = EXCLUDED.notes;
