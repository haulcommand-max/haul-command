// lib/pr/engine.ts
//
// PR Authority Engine — Journalist Request Pipeline
// Spec: AG-MKT-PR-52-GLOBAL-001
//
// Provides:
// - Request intake and classification
// - Auto-matching to datasets/reports
// - Response generation templates
// - Spokesperson routing
// - Backlink tracking

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface IngestRequest {
    source_channel: 'featured_haro' | 'qwoted' | 'sourcebottle' | 'x_journorequest' | 'direct' | 'manual';
    journalist_name?: string;
    outlet_name?: string;
    outlet_domain?: string;
    country_iso2?: string;
    topic_tags?: string[];
    request_text: string;
    deadline_at?: string;
    response_requirements?: string;
    raw_payload?: Record<string, unknown>;
}

export interface ClassificationResult {
    relevance_score: number;       // 0-1
    matched_report_id?: string;
    matched_dataset?: string;
    recommended_template?: string;
    recommended_spokesperson_tags?: string[];
    auto_respond: boolean;
    rationale: string;
}

export interface ResponseTemplate {
    id: string;
    name: string;
    category: string;
    subject_line: string;
    body: string;
    variables: string[];
}

// ============================================================
// DATASET + REPORT REGISTRY (matched against requests)
// ============================================================

const REPORT_KEYWORDS: Array<{
    report_id: string;
    keywords: string[];
    dataset: string;
    template: string;
    expertise_tags: string[];
}> = [
        {
            report_id: 'RPT-ESCORT-RATE-INDEX',
            keywords: ['escort', 'pilot car', 'rate', 'pricing', 'cost', 'oversize', 'wide load'],
            dataset: 'escort_rate_index',
            template: 'PR-TPL-DATA-001',
            expertise_tags: ['corridor_knowledge', 'rates'],
        },
        {
            report_id: 'RPT-PERMIT-WAIT-TIME',
            keywords: ['permit', 'wait time', 'approval', 'delay', 'processing', 'dot', 'department of transportation'],
            dataset: 'permit_processing_times',
            template: 'PR-TPL-DATA-001',
            expertise_tags: ['compliance'],
        },
        {
            report_id: 'RPT-CORRIDOR-DENSITY',
            keywords: ['corridor', 'route', 'freight', 'density', 'volume', 'traffic', 'heavy haul'],
            dataset: 'corridor_heatmaps',
            template: 'PR-TPL-ANALYSIS-001',
            expertise_tags: ['corridor_knowledge'],
        },
        {
            report_id: 'RPT-SAFETY-INCIDENT',
            keywords: ['safety', 'incident', 'accident', 'crash', 'fatality', 'regulation', 'enforcement'],
            dataset: 'safety_incident_registry',
            template: 'PR-TPL-EXPERT-001',
            expertise_tags: ['safety', 'compliance'],
        },
        {
            report_id: 'RPT-MARKET-SIZE',
            keywords: ['market', 'size', 'growth', 'industry', 'revenue', 'forecast', 'trucking', 'transport'],
            dataset: 'market_intelligence',
            template: 'PR-TPL-ANALYSIS-001',
            expertise_tags: ['corridor_knowledge', 'rates'],
        },
        {
            report_id: 'RPT-OPERATOR-SHORTAGE',
            keywords: ['shortage', 'driver', 'operator', 'workforce', 'hiring', 'recruitment', 'capacity'],
            dataset: 'operator_supply_index',
            template: 'PR-TPL-EXPERT-001',
            expertise_tags: ['corridor_knowledge'],
        },
        {
            report_id: 'RPT-BRIDGE-WEIGHT-LIMITS',
            keywords: ['bridge', 'weight', 'limit', 'infrastructure', 'load', 'restriction', 'structure'],
            dataset: 'bridge_weight_registry',
            template: 'PR-TPL-DATA-001',
            expertise_tags: ['compliance', 'safety'],
        },
        {
            report_id: 'RPT-GREEN-LOGISTICS',
            keywords: ['green', 'sustainability', 'emission', 'carbon', 'electric', 'ev', 'environment'],
            dataset: 'green_logistics_index',
            template: 'PR-TPL-EXPERT-001',
            expertise_tags: ['compliance'],
        },
    ];

// ============================================================
// RESPONSE TEMPLATES
// ============================================================

const TEMPLATES: ResponseTemplate[] = [
    {
        id: 'PR-TPL-DATA-001',
        name: 'Data-Backed Response',
        category: 'data',
        subject_line: 'RE: {{topic}} — Data from Haul Command',
        body: `Hi {{journalist_name}},

{{spokesperson_name}}, {{spokesperson_title}} and a verified operator on Haul Command, can provide expert commentary on this topic.

Based on data from Haul Command's {{dataset_name}}, which tracks {{data_description}}:

{{data_points}}

Key takeaway: {{key_insight}}

{{spokesperson_name}} is available for a follow-up call.

Best,
Haul Command Data Desk
{{citation_url}}`,
        variables: ['journalist_name', 'spokesperson_name', 'spokesperson_title', 'dataset_name', 'data_description', 'data_points', 'key_insight', 'citation_url'],
    },
    {
        id: 'PR-TPL-ANALYSIS-001',
        name: 'Analysis Response',
        category: 'analysis',
        subject_line: 'RE: {{topic}} — Analysis from Haul Command',
        body: `Hi {{journalist_name}},

We've been tracking {{topic_area}} through our platform data. Here's what we're seeing:

{{analysis_text}}

Our data covers {{coverage_scope}} with {{data_freshness}} data.

Happy to provide additional breakdowns or connect you with an operator for on-the-ground perspective.

Best,
Haul Command Data Desk
{{citation_url}}`,
        variables: ['journalist_name', 'topic_area', 'analysis_text', 'coverage_scope', 'data_freshness', 'citation_url'],
    },
    {
        id: 'PR-TPL-EXPERT-001',
        name: 'Expert Quote Response',
        category: 'expert',
        subject_line: 'RE: {{topic}} — Expert Source Available',
        body: `Hi {{journalist_name}},

{{spokesperson_name}}, {{spokesperson_title}}, would be a great source for your story on {{topic}}.

{{spokesperson_name}}'s perspective:

"{{expert_quote}}"

{{spokesperson_name}} has {{experience_description}} and can speak to this topic in detail.

Best,
Haul Command PR
{{citation_url}}`,
        variables: ['journalist_name', 'spokesperson_name', 'spokesperson_title', 'topic', 'expert_quote', 'experience_description', 'citation_url'],
    },
];

// ============================================================
// CLASSIFICATION ENGINE
// ============================================================

function classifyRequest(req: IngestRequest): ClassificationResult {
    const text = (req.request_text + ' ' + (req.topic_tags?.join(' ') || '')).toLowerCase();

    let bestMatch: typeof REPORT_KEYWORDS[0] | null = null;
    let bestScore = 0;

    for (const report of REPORT_KEYWORDS) {
        let hits = 0;
        for (const kw of report.keywords) {
            if (text.includes(kw)) hits++;
        }
        const score = hits / report.keywords.length;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = report;
        }
    }

    // Threshold for auto-respond
    const relevanceScore = bestScore;
    const autoRespond = relevanceScore >= 0.4 && !!bestMatch;

    return {
        relevance_score: Math.round(relevanceScore * 100) / 100,
        matched_report_id: bestMatch?.report_id,
        matched_dataset: bestMatch?.dataset,
        recommended_template: bestMatch?.template,
        recommended_spokesperson_tags: bestMatch?.expertise_tags,
        auto_respond: autoRespond,
        rationale: bestMatch
            ? `Matched ${bestMatch.report_id} with score ${relevanceScore.toFixed(2)}`
            : 'No strong match found',
    };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Ingest a new journalist request.
 * - Classifies and stores
 * - Returns classification result for downstream handling
 */
export async function ingestJournalistRequest(req: IngestRequest): Promise<{
    request_id: string;
    classification: ClassificationResult;
}> {
    const supabase = getSupabaseAdmin();
    const classification = classifyRequest(req);

    // Upsert outlet if domain provided
    let outletId: string | null = null;
    if (req.outlet_domain) {
        const { data: outlet } = await supabase
            .from('pr_outlets')
            .upsert({
                name: req.outlet_name || req.outlet_domain,
                domain: req.outlet_domain,
                country_iso2: req.country_iso2,
            }, { onConflict: 'domain' })
            .select('id')
            .single();
        outletId = outlet?.id || null;
    }

    // Insert request
    const { data: request, error } = await supabase
        .from('pr_journalist_requests')
        .insert({
            source_channel: req.source_channel,
            outlet_id: outletId,
            country_iso2: req.country_iso2,
            topic_tags: req.topic_tags,
            deadline_at: req.deadline_at,
            journalist_name: req.journalist_name,
            outlet_name: req.outlet_name,
            outlet_domain: req.outlet_domain,
            request_text: req.request_text,
            response_requirements: req.response_requirements,
            matched_report_id: classification.matched_report_id,
            matched_dataset: classification.matched_dataset,
            relevance_score: classification.relevance_score,
            status: classification.auto_respond ? 'assigned' : 'new',
            raw_payload: req.raw_payload as never,
        })
        .select('id')
        .single();

    if (error) throw new Error(`Failed to ingest request: ${error.message}`);

    return {
        request_id: request!.id,
        classification,
    };
}

/**
 * Find best spokesperson for a set of expertise tags + country.
 */
export async function findSpokesperson(
    expertiseTags: string[],
    countryIso2?: string
): Promise<{
    spokesperson_id: string;
    display_name: string;
    title: string | null;
    company_name: string | null;
} | null> {
    const supabase = getSupabaseAdmin();

    let query = supabase
        .from('pr_spokespeople')
        .select('id, display_name, title, company_name, expertise_tags, response_count')
        .eq('is_active', true)
        .order('response_count', { ascending: true }) // prefer less-used spokespeople
        .limit(10);

    if (countryIso2) {
        query = query.eq('country_iso2', countryIso2);
    }

    const { data } = await query;
    if (!data?.length) return null;

    // Score by tag overlap
    let best = data[0];
    let bestTagScore = 0;

    for (const sp of data) {
        const tagOverlap = (sp.expertise_tags || []).filter((t: string) => expertiseTags.includes(t)).length;
        if (tagOverlap > bestTagScore) {
            bestTagScore = tagOverlap;
            best = sp;
        }
    }

    return {
        spokesperson_id: best.id,
        display_name: best.display_name,
        title: best.title,
        company_name: best.company_name,
    };
}

/**
 * Get a response template by ID.
 */
export function getTemplate(templateId: string): ResponseTemplate | null {
    return TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Render a template with variables.
 */
export function renderTemplate(template: ResponseTemplate, vars: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject_line;
    let body = template.body;

    for (const [key, value] of Object.entries(vars)) {
        const placeholder = `{{${key}}}`;
        subject = subject.split(placeholder).join(value);
        body = body.split(placeholder).join(value);
    }

    return { subject, body };
}

/**
 * Record a backlink hit.
 */
export async function recordBacklink(params: {
    response_id?: string;
    outlet_id?: string;
    source_url: string;
    target_url: string;
    anchor_text?: string;
    is_dofollow?: boolean;
    domain_authority?: number;
    country_iso2?: string;
}): Promise<string> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('pr_backlink_hits')
        .upsert({
            ...params,
            discovered_at: new Date().toISOString(),
        }, { onConflict: 'source_url,target_url' })
        .select('id')
        .single();

    if (error) throw new Error(`Failed to record backlink: ${error.message}`);
    return data!.id;
}

/**
 * Get PR pipeline stats.
 */
export async function getPipelineStats(): Promise<{
    total_requests: number;
    pending: number;
    responded: number;
    published: number;
    backlinks: number;
    avg_relevance: number;
}> {
    const supabase = getSupabaseAdmin();

    const [reqStats, backlinkCount] = await Promise.all([
        supabase.rpc('pr_pipeline_stats'),
        supabase.from('pr_backlink_hits').select('id', { count: 'exact', head: true }),
    ]);

    const stats = reqStats.data as {
        total_requests: number;
        pending: number;
        responded: number;
        published: number;
        avg_relevance: number;
    } | null;

    return {
        total_requests: stats?.total_requests || 0,
        pending: stats?.pending || 0,
        responded: stats?.responded || 0,
        published: stats?.published || 0,
        backlinks: backlinkCount.count || 0,
        avg_relevance: stats?.avg_relevance || 0,
    };
}
