-- IDENTITY, KYC, AND DOCUMENT VAULT STRUCTURES

-- Ensure the profiles table tracks KYC status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_provider_ref text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compliance_level_percent integer DEFAULT 0;

-- Supabase Storage structure for Secure Document Vaults (BOLs, Insurance)
INSERT INTO storage.buckets (id, name, public) VALUES ('secure_vault', 'secure_vault', false) ON CONFLICT DO NOTHING;

-- Storage RLS Policies: Users can only upload and read their own secure documents
CREATE POLICY "Vault Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'secure_vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Vault Read Access" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'secure_vault' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add public share slugs (unique constraints)
ALTER TABLE hc_training_career_cards DROP CONSTRAINT IF EXISTS unique_share_slug;
ALTER TABLE hc_training_career_cards ADD CONSTRAINT unique_share_slug UNIQUE (share_slug);
