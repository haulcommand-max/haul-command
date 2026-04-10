import os
import shutil

repo = r"C:\Users\PC User\.gemini\antigravity\scratch\haul-command"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

# =========================================================
# 1. FINTECH DUALITY UNIFICATION
# =========================================================
hc_pay_dir = os.path.join(repo, "lib", "hc-pay")
ensure_dir(hc_pay_dir)

unified_checkout_path = os.path.join(hc_pay_dir, "unified-checkout.ts")
unified_checkout_code = """/**
 * Haul Command Unified Checkout Gateway
 * 
 * Supports two strict parallel paths per architectural spec:
 * 1. Stripe (Fiat, Cards, CashApp, Apple Pay, Google Pay)
 * 2. NOWPayments (Crypto: ADA, BTC, and 350+ coins)
 */

import { createPayment as createCryptoPayment, NOWPaymentResult } from './nowpayments';

export interface CheckoutRequest {
    userId: string;
    orderId: string;
    amountUsd: number;
    description: string;
    paymentMethod: 'stripe' | 'crypto';
    cryptoCurrency?: string; // e.g., 'ada', 'btc'
}

export class CheckoutGateway {
    static async initiate(req: CheckoutRequest) {
        if (req.paymentMethod === 'stripe') {
            // Initiate Stripe Checkout session
            // Requires 'stripe' package, simplified for architecture mapping
            // It will natively support CashApp and other local payment interfaces
            return {
                type: 'stripe',
                checkoutUrl: `https://checkout.stripe.com/c/pay/${req.orderId}`,
                amountUsd: req.amountUsd
            };
        } else if (req.paymentMethod === 'crypto') {
            if (!req.cryptoCurrency) {
                throw new Error("cryptoCurrency is required for crypto payments");
            }
            const cryptoRes: NOWPaymentResult = await createCryptoPayment({
                priceAmountUsd: req.amountUsd,
                payCurrency: req.cryptoCurrency, // NowPayments code (ada, btc, etc.)
                orderId: req.orderId,
                orderDescription: req.description,
                ipnCallbackUrl: `https://api.haulcommand.com/webhooks/nowpayments`
            });

            return {
                type: 'crypto',
                payAddress: cryptoRes.pay_address,
                payAmount: cryptoRes.pay_amount,
                payCurrency: cryptoRes.pay_currency,
                invoiceUrl: cryptoRes.invoice_url
            };
        }
        
        throw new Error("Invalid payment method selected.");
    }
}
"""
with open(unified_checkout_path, "w", encoding="utf-8") as f:
    f.write(unified_checkout_code)


# =========================================================
# 2. TRAINING OS SUPABASE MIGRATION
# =========================================================
migrations_dir = os.path.join(repo, "supabase", "migrations")
ensure_dir(migrations_dir)
migration_path = os.path.join(migrations_dir, "0038_training_os_schema.sql")

migration_sql = """-- HAUL COMMAND TRAINING OS, COMPLIANCE, AND REPORT CARD SCHEMA (v1)

CREATE TABLE IF NOT EXISTS hc_training_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    primary_role text,
    secondary_roles text[],
    home_country_code text DEFAULT 'US',
    home_region_code text,
    active_market_codes text[],
    availability_status text DEFAULT 'OFFLINE',
    first_job_goal_date timestamptz,
    accelerator_enrolled_at timestamptz,
    accelerator_phase text DEFAULT 'Launch',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_report_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    profile_completeness int DEFAULT 0,
    training_completion_percent int DEFAULT 0,
    first_14_day_percent int DEFAULT 0,
    starter_packet_status text DEFAULT 'INCOMPLETE',
    broker_ready_status text DEFAULT 'NOT_READY',
    readiness_score numeric DEFAULT 0,
    trust_score numeric DEFAULT 0,
    packet_completeness_score numeric DEFAULT 0,
    response_quality_score numeric DEFAULT 0,
    current_rank_slug text DEFAULT 'rookie',
    current_certificate_tier text DEFAULT 'none',
    next_best_actions jsonb DEFAULT '[]',
    last_diagnostic_summary jsonb DEFAULT '{}',
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_career_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    hall_command_id text UNIQUE NOT NULL,
    display_name text,
    badges jsonb DEFAULT '[]',
    certificates jsonb DEFAULT '[]',
    specializations jsonb DEFAULT '[]',
    training_hours numeric DEFAULT 0,
    jobs_completed int DEFAULT 0,
    markets_active int DEFAULT 0,
    career_milestones jsonb DEFAULT '[]',
    share_slug text UNIQUE,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_accelerator_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    phase text,
    event_payload jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_diagnostics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    opportunity_ref text,
    diagnostic_type text,
    likely_reason text,
    recommended_fix text,
    linked_module_slug text,
    linked_upgrade_slug text,
    severity text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    certificate_type text,
    tier text,
    country_code text,
    track_slug text,
    issued_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    verification_slug text UNIQUE,
    metadata jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS hc_training_country_overlays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code text NOT NULL,
    region_code text,
    authority_type text,
    authority_name text,
    local_terminology jsonb DEFAULT '{}',
    requirements jsonb DEFAULT '{}',
    notes jsonb DEFAULT '{}',
    version int DEFAULT 1,
    last_verified_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_slug text NOT NULL,
    module_slug text NOT NULL,
    lesson_slug text NOT NULL,
    title text NOT NULL,
    free_or_paid text DEFAULT 'free',
    video_url text,
    transcript text,
    lesson_markdown text,
    downloadables jsonb DEFAULT '[]',
    visual_assets jsonb DEFAULT '[]',
    country_overlay_supported boolean DEFAULT true,
    faq jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS hc_training_user_lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id uuid REFERENCES hc_training_lessons(id),
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    progress_percent int DEFAULT 0,
    notes jsonb DEFAULT '{}'
);
"""

with open(migration_path, "w", encoding="utf-8") as f:
    f.write(migration_sql)


# =========================================================
# 3. ROUTE SCAFFOLDING FOR NEXT.JS App Dir
# =========================================================
app_dir = os.path.join(repo, "app")
training_dir = os.path.join(app_dir, "training")
ensure_dir(training_dir)

# Helper for creating a basic Page
def create_page(path, content):
    ensure_dir(path)
    with open(os.path.join(path, "page.tsx"), "w", encoding="utf-8") as f:
        f.write(content)

create_page(training_dir, """import React from 'react';
export default function TrainingHub() {
    return (
        <main className="min-h-screen bg-gray-950 text-white">
            <section className="hero p-10 text-center border-b border-gray-800">
                <h1 className="text-5xl font-bold mb-4">The Global Compliance, Training, & Readiness OS</h1>
                <p className="text-xl text-gray-400">The fastest path from new entrant to trusted heavy-haul operator.</p>
                <div className="flex gap-4 justify-center mt-6">
                    <button className="bg-blue-600 px-6 py-3 font-semibold rounded-md hover:bg-blue-500">Start 14-Day Free Journey</button>
                    <button className="bg-gray-800 px-6 py-3 font-semibold rounded-md border border-gray-700 hover:bg-gray-700">Check Your Readiness Status</button>
                </div>
            </section>
            
            <section className="tracks grid grid-cols-1 md:grid-cols-3 gap-6 p-10">
                <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold">14-Day First Job Journey</h3>
                    <p className="text-gray-400 mt-2">Activate availability, build a broker-ready packet, and master the entry path.</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold">18-Month Career Accelerator</h3>
                    <p className="text-gray-400 mt-2">Get Elite. Badges, specializations, and premium market placements over time.</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold">Premium Certification</h3>
                    <p className="text-gray-400 mt-2">Route surveying, load dynamics, escort command training. Verified on your ID.</p>
                </div>
            </section>
        </main>
    )
}
""")

# Country overlay dynamic route
create_page(os.path.join(training_dir, "[country]"), """import React from 'react';
export default function CountryTrainingOverlay({ params }: { params: { country: string } }) {
    return (
        <div className="p-10 text-white bg-gray-950 min-h-screen">
            <h1 className="text-3xl font-bold">Compliance Operations in {params.country.toUpperCase()}</h1>
            <p className="text-gray-400">Loading country-specific overlay variables, terminology, and enforcing authority context...</p>
        </div>
    )
}
""")

# Track/Module/Lesson nesting
create_page(os.path.join(training_dir, "[track]", "[module]", "[lesson]"), """import React from 'react';
export default function LessonPage({ params }: { params: { track: string, module: string, lesson: string } }) {
    return (
        <div className="p-10 text-white bg-gray-950 min-h-screen">
            <h2 className="text-2xl font-bold uppercase text-blue-500">{params.track} • {params.module}</h2>
            <h1 className="text-4xl font-bold mt-2">{params.lesson.replace(/-/g, ' ')}</h1>
            <div className="mt-8 bg-gray-900 p-10 border border-gray-800 rounded-lg aspect-video flex justify-center items-center">
                <span className="text-gray-600 font-bold tracking-widest">[ 4K / 8K VIDEO SOURCE ]</span>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-bold">Lesson Protocol</h3>
                    <p className="mt-4 text-gray-400">What this is. Why it matters. How to do it. Visual examples. Downloadable packet attachments.</p>
                    <button className="mt-6 bg-blue-600 px-6 py-2 rounded-md font-semibold font-mono text-sm hover:bg-blue-500 hover:text-white">MARK LESSON COMPLETED</button>
                </div>
                <div className="bg-gray-900 border border-red-900/50 p-6 rounded-lg relative overflow-hidden">
                    <h3 className="text-red-500 font-bold mb-2">COMMON FATAL MISTAKE</h3>
                    <p className="text-gray-400 text-sm">Most operators lose the job here because of failed communication.</p>
                </div>
            </div>
        </div>
    )
}
""")

# Report Card Route
create_page(os.path.join(app_dir, "(app)", "training", "report-card"), """import React from 'react';
export default function ReportCard() {
    return (
        <div className="p-10 text-white bg-gray-950 min-h-screen">
            <h1 className="text-4xl font-bold">Career & Report Card</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 border-l-4 border-l-blue-500">
                    <p className="text-sm text-gray-400 uppercase">Trust Score</p>
                    <h2 className="text-3xl font-bold">8.4 / 10</h2>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-400 uppercase">Readiness Score</p>
                    <h2 className="text-3xl font-bold">92%</h2>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                    <p className="text-sm text-gray-400 uppercase">Training Completed</p>
                    <h2 className="text-3xl font-bold">14 / 80 lessons</h2>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                    <p className="text-sm text-gray-400 uppercase">HC Certified</p>
                    <h2 className="text-3xl font-bold">Pending</h2>
                </div>
            </div>
            
            <section className="mt-10">
                <h3 className="text-2xl font-bold text-red-500">Diagnostics (Why you didn't get picked)</h3>
                <div className="bg-gray-900 border border-gray-800 p-4 mt-4 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-bold">Missing Local Overlay Packet</p>
                        <p className="text-sm text-gray-400">Your profile lacks the TX state regulations certification required by brokers in this corridor.</p>
                    </div>
                    <button className="bg-gray-800 px-4 py-2 border border-blue-500/50 rounded text-blue-400 font-bold hover:bg-gray-800">Fix Gap Immediately</button>
                </div>
            </section>
        </div>
    )
}
""")

print("Successfully generated FinTech duality scripts, Training OS database schemas, and Next.js hierarchical route structures.")
