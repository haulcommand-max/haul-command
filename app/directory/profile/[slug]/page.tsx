import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shield, MapPin, Phone, Star, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// DIRECTORY PROFILE — /directory/profile/:slug
// Public-facing operator profile page.
// Pulls from directory_listings by slug.
// ══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createClient();
    let { data } = await supabase
        .from('directory_listings')
        .select('name, city, region_code, entity_type')
        .eq('slug', slug)
        .maybeSingle();

    // Fallback to hc_global_operators if not in directory_listings
    if (!data) {
        const { data: globalData } = await supabase
            .from('hc_global_operators')
            .select('name, city, admin1_code, country_code, role_primary')
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .maybeSingle();
        if (globalData) {
            data = {
                name: globalData.name,
                city: globalData.city,
                region_code: globalData.admin1_code,
                entity_type: globalData.role_primary || 'operator',
            };
        }
    }

    const name = data?.name || slug.replace(/-/g, ' ');
    const location = [data?.city, data?.region_code].filter(Boolean).join(', ');

    return {
        title: `${name} — ${location || 'Operator'} | Haul Command Directory`,
        description: `${name} is a verified heavy haul operator${location ? ` in ${location}` : ''}. View profile, trust score, services, and contact information on Haul Command.`,
        alternates: { canonical: `https://haulcommand.com/directory/profile/${slug}` },
    };
}

export default async function OperatorProfilePage({ params }: Props) {
    const { slug } = await params;
    const supabase = createClient();

    const { data: operator } = await supabase
        .from('directory_listings')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (!operator) {
        // Fallback 1: Try finding by entity_id in directory_listings
        const { data: byId } = await supabase
            .from('directory_listings')
            .select('*')
            .eq('entity_id', slug)
            .maybeSingle();

        if (byId) return renderProfile(byId);

        // Fallback 2: Try hc_global_operators (directory main page uses this table)
        // This prevents 404s when an operator is in hc_global_operators but not directory_listings
        const { data: globalOp } = await supabase
            .from('hc_global_operators')
            .select('*')
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .maybeSingle();

        if (globalOp) {
            // Normalize hc_global_operators columns to match directory_listings shape
            const normalized = {
                ...globalOp,
                region_code: globalOp.admin1_code || globalOp.region_code,
                rank_score: globalOp.confidence_score || globalOp.rank_score || 0,
                entity_type: globalOp.role_primary || globalOp.entity_type || 'operator',
                claim_status: globalOp.is_claimed ? 'claimed' : 'unclaimed',
                entity_confidence_score: globalOp.confidence_score || 0,
            };
            return renderProfile(normalized);
        }

        notFound();
    }

    return renderProfile(operator);
}

import { OperatorTemplate, InfrastructureTemplate } from './EntityTemplates';
import { Building, Factory, Wrench } from 'lucide-react';

function renderProfile(op: any) {
    const isClaimed = op.claim_status === 'claimed';
    const trustScore = op.rank_score || op.entity_confidence_score || 0;
    const trustPct = Math.min(Math.round(trustScore * 100), 100);
    const location = [op.city, op.region_code].filter(Boolean).join(', ');
    const countryFlag = op.country_code === 'CA' ? '🇨🇦' : op.country_code === 'US' ? '🇺🇸' : '🌍';

    const trustColor = trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#ef4444';
    const trustLabel = trustPct >= 80 ? 'High Trust' : trustPct >= 50 ? 'Moderate' : 'Unverified';

    const props = { op, isClaimed, trustPct, trustColor, trustLabel, location, countryFlag };

    // Route to correct template based on entity type
    if (op.entity_type === 'hotel' || op.entity_type === 'motel') {
        return <InfrastructureTemplate {...props} typeLabel="Lodging & Hotel" iconObj={<Building style={{ width: 28, height: 28 }} />} />;
    }
    if (op.entity_type === 'yard' || op.entity_type === 'parking') {
        return <InfrastructureTemplate {...props} typeLabel="Secure Yard / Parking" iconObj={<Factory style={{ width: 28, height: 28 }} />} />;
    }
    if (op.entity_type === 'repair' || op.entity_type === 'installer') {
        return <InfrastructureTemplate {...props} typeLabel="Repair Shop / Installer" iconObj={<Wrench style={{ width: 28, height: 28 }} />} />;
    }
    
    // Default fallback to Operator style
    return <OperatorTemplate {...props} />;
}

