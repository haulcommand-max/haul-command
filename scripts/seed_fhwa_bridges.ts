import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const mockFHWARestrictions = [
    {
        lat: 41.8781, lng: -87.6298, // Chicago, IL Wait (just an example)
        road_name: 'Eisenhower Expressway',
        state_code: 'IL',
        restriction_type: 'bridge_height',
        max_height_ft: 13.5,
        source: 'nbi',
        confidence_score: 1.0,
        notes: 'FHWA NBI Database Seed'
    },
    {
        lat: 40.7128, lng: -74.0060, // NYC
        road_name: 'FDR Drive',
        state_code: 'NY',
        restriction_type: 'bridge_height',
        max_height_ft: 12.0,
        source: 'nbi',
        confidence_score: 1.0,
        notes: 'FHWA NBI Database Seed'
    },
    {
        lat: 34.0522, lng: -118.2437, // LA
        road_name: 'Arroyo Seco Pkwy',
        state_code: 'CA',
        restriction_type: 'bridge_height',
        max_height_ft: 14.0, // Bare minimum
        source: 'nbi',
        confidence_score: 1.0,
        notes: 'FHWA NBI Database Seed'
    },
    {
        lat: 30.2672, lng: -97.7431, // Austin
        road_name: 'S Congress Ave Bridge',
        state_code: 'TX',
        restriction_type: 'bridge_weight',
        max_weight_lbs: 40000, // Load restricted
        source: 'nbi',
        confidence_score: 1.0,
        notes: 'FHWA NBI Database Seed'
    },
    {
        lat: 39.7392, lng: -104.9903, // Denver
        road_name: 'I-70 Mountain Corridor',
        state_code: 'CO',
        restriction_type: 'no_hazmat', // Eisenhower tunnel
        source: 'state_dot',
        confidence_score: 1.0,
        notes: 'CDOT Restriction'
    }
];

const mockHazards = [
    {
        lat: 41.8818, lng: -87.6231, // Chicago
        hazard_type: 'low_bridge',
        description: 'Bridge looks lower than posted 13ft 6in. Bumping my roof.',
        measured_height_ft: 13.4,
        severity: 'high',
        is_active: true,
        confidence_score: 0.9,
    },
    {
        lat: 40.7306, lng: -73.9352, // Queens
        hazard_type: 'narrow_road',
        description: 'Construction on right lane, tight for 12ft wide loads.',
        measured_width_ft: 11.5,
        severity: 'medium',
        is_active: true,
        confidence_score: 0.85,
    }
];

async function seedData() {
    console.log("Seeding FHWA Bridge Data and Hazard Reports...");

    // Insert Road Restrictions
    for (const restriction of mockFHWARestrictions) {
        const { error } = await supabase.from('road_restrictions').insert(restriction);
        if (error) console.error("Error inserting road restriction:", error);
    }
    console.log(`✅ Seeded ${mockFHWARestrictions.length} NBI Road Restrictions.`);

    // Insert Hazard Reports
    for (const hazard of mockHazards) {
        const { error } = await supabase.from('hazard_reports').insert(hazard);
        if (error) console.error("Error inserting hazard report:", error);
    }
    console.log(`✅ Seeded ${mockHazards.length} Waze-style Hazard Reports.`);

    console.log("FHWA Seed Complete.");
}

seedData().catch(console.error);
