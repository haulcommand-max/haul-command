/**
 * Broker ↔ Escort Relationship Graph Engine
 * 
 * Builds and maintains a directed weighted graph of relationships
 * between brokers, carriers, escorts, ports, corridors, and metros.
 * 
 * Supports: incremental edge updates, score recomputation, 
 * recommendation generation, fraud detection signals.
 * 
 * Edge weight formula:
 *   broker_to_escort = (jobs_completed*0.55 + repeat_rate*0.20 + payment_on_time*0.15 + review_signal*0.10) * recency_decay
 *   escort_to_corridor = route_count * recency_decay
 *   broker_to_corridor = lane_count * recency_decay
 */

import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type NodeType = 'broker' | 'carrier' | 'escort_operator' | 'port_terminal' | 'corridor' | 'metro' | 'permit_agency';
export type EdgeType = 'broker_to_escort' | 'escort_to_corridor' | 'broker_to_corridor' | 'carrier_to_escort' | 'escort_to_port' | 'broker_to_carrier';

export interface GraphNode {
    nodeId?: string;
    nodeType: NodeType;
    entityId: string;
    countryCode?: string;
    labels?: string[];
    metadata?: Record<string, unknown>;
}

export interface GraphEdge {
    fromNodeId: string;
    toNodeId: string;
    edgeType: EdgeType;
    weight: number;
    evidence: Record<string, unknown>;
}

export interface GraphScore {
    entityId: string;
    scoreType: string;
    scoreValue: number;
    metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// WEIGHT FORMULAS
// ═══════════════════════════════════════════════════════════════

interface BrokerEscortEvidence {
    jobsCompleted: number;
    repeatRate: number;       // 0-1
    paymentOnTime: number;    // 0-1
    reviewSignal: number;     // 0-1
    lastJobDate: string;      // ISO date
}

interface RouteEvidence {
    routeCount: number;
    lastRouteDate: string;
}

interface LaneEvidence {
    laneCount: number;
    lastLaneDate: string;
}

/** Recency decay: halves every 90 days */
function recencyDecay(lastDate: string): number {
    const ageDays = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0.05, Math.pow(0.5, ageDays / 90));
}

export function computeBrokerEscortWeight(evidence: BrokerEscortEvidence): number {
    const raw =
        (evidence.jobsCompleted * 0.55) +
        (evidence.repeatRate * 0.20) +
        (evidence.paymentOnTime * 0.15) +
        (evidence.reviewSignal * 0.10);

    // Normalize jobs (log scale, caps at ~50 jobs)
    const normalizedJobs = Math.min(1.0, Math.log10(evidence.jobsCompleted + 1) / Math.log10(51));
    const normalizedRaw =
        (normalizedJobs * 0.55) +
        (evidence.repeatRate * 0.20) +
        (evidence.paymentOnTime * 0.15) +
        (evidence.reviewSignal * 0.10);

    return Math.round(normalizedRaw * recencyDecay(evidence.lastJobDate) * 10000) / 10000;
}

export function computeRouteWeight(evidence: RouteEvidence): number {
    const normalized = Math.min(1.0, Math.log10(evidence.routeCount + 1) / Math.log10(101));
    return Math.round(normalized * recencyDecay(evidence.lastRouteDate) * 10000) / 10000;
}

export function computeLaneWeight(evidence: LaneEvidence): number {
    const normalized = Math.min(1.0, Math.log10(evidence.laneCount + 1) / Math.log10(51));
    return Math.round(normalized * recencyDecay(evidence.lastLaneDate) * 10000) / 10000;
}

// ═══════════════════════════════════════════════════════════════
// NODE/EDGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/** Ensure a node exists, returning its node_id */
export async function ensureNode(node: GraphNode): Promise<string> {
    const supabase = getSupabase();

    const { data: existing } = await supabase
        .from('graph_nodes')
        .select('node_id')
        .eq('node_type', node.nodeType)
        .eq('entity_id', node.entityId)
        .single();

    if (existing) return existing.node_id;

    const { data: created, error } = await supabase
        .from('graph_nodes')
        .insert({
            node_type: node.nodeType,
            entity_id: node.entityId,
            country_code: node.countryCode,
            labels_json: node.labels || [],
            metadata_json: node.metadata || {},
        })
        .select('node_id')
        .single();

    if (error) throw new Error(`ensureNode failed: ${error.message}`);
    return created!.node_id;
}

/** Upsert an edge with weight calculation */
export async function upsertEdge(edge: GraphEdge): Promise<void> {
    const supabase = getSupabase();

    await supabase.from('graph_edges').upsert({
        from_node_id: edge.fromNodeId,
        to_node_id: edge.toNodeId,
        edge_type: edge.edgeType,
        weight: edge.weight,
        evidence_json: edge.evidence,
        last_seen_at: new Date().toISOString(),
    }, { onConflict: 'from_node_id,to_node_id,edge_type' });
}

// ═══════════════════════════════════════════════════════════════
// HIGH-LEVEL: Record a completed job
// ═══════════════════════════════════════════════════════════════

export interface CompletedJob {
    brokerId: string;
    escortOperatorId: string;
    carrierId?: string;
    corridorSlug?: string;
    portId?: string;
    countryCode: string;
    jobsCompleted: number;
    repeatRate: number;
    paymentOnTime: number;
    reviewSignal: number;
    jobDate: string;
}

export async function recordCompletedJob(job: CompletedJob): Promise<void> {
    // Ensure nodes
    const brokerNodeId = await ensureNode({
        nodeType: 'broker',
        entityId: job.brokerId,
        countryCode: job.countryCode,
    });

    const escortNodeId = await ensureNode({
        nodeType: 'escort_operator',
        entityId: job.escortOperatorId,
        countryCode: job.countryCode,
    });

    // Broker → Escort edge
    const beWeight = computeBrokerEscortWeight({
        jobsCompleted: job.jobsCompleted,
        repeatRate: job.repeatRate,
        paymentOnTime: job.paymentOnTime,
        reviewSignal: job.reviewSignal,
        lastJobDate: job.jobDate,
    });

    await upsertEdge({
        fromNodeId: brokerNodeId,
        toNodeId: escortNodeId,
        edgeType: 'broker_to_escort',
        weight: beWeight,
        evidence: {
            jobsCompleted: job.jobsCompleted,
            repeatRate: job.repeatRate,
            paymentOnTime: job.paymentOnTime,
            reviewSignal: job.reviewSignal,
            lastJobDate: job.jobDate,
        },
    });

    // Escort → Corridor edge (if corridor specified)
    if (job.corridorSlug) {
        const corridorNodeId = await ensureNode({
            nodeType: 'corridor',
            entityId: job.corridorSlug,
            countryCode: job.countryCode,
        });

        const ecWeight = computeRouteWeight({
            routeCount: job.jobsCompleted,
            lastRouteDate: job.jobDate,
        });

        await upsertEdge({
            fromNodeId: escortNodeId,
            toNodeId: corridorNodeId,
            edgeType: 'escort_to_corridor',
            weight: ecWeight,
            evidence: { routeCount: job.jobsCompleted, lastRouteDate: job.jobDate },
        });

        // Broker → Corridor edge
        const bcWeight = computeLaneWeight({
            laneCount: job.jobsCompleted,
            lastLaneDate: job.jobDate,
        });

        await upsertEdge({
            fromNodeId: brokerNodeId,
            toNodeId: corridorNodeId,
            edgeType: 'broker_to_corridor',
            weight: bcWeight,
            evidence: { laneCount: job.jobsCompleted, lastLaneDate: job.jobDate },
        });
    }

    // Carrier → Escort edge (if carrier specified)
    if (job.carrierId) {
        const carrierNodeId = await ensureNode({
            nodeType: 'carrier',
            entityId: job.carrierId,
            countryCode: job.countryCode,
        });

        await upsertEdge({
            fromNodeId: carrierNodeId,
            toNodeId: escortNodeId,
            edgeType: 'carrier_to_escort',
            weight: beWeight * 0.85, // slightly lower weight than broker
            evidence: { jobsCompleted: job.jobsCompleted, lastJobDate: job.jobDate },
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// SCORE RECOMPUTATION (daily job)
// ═══════════════════════════════════════════════════════════════

export async function recomputeGraphScores(): Promise<{
    scoresComputed: number;
    errors: string[];
}> {
    const supabase = getSupabase();
    const errors: string[] = [];
    let scoresComputed = 0;

    // 1. Broker Trust Score
    // = average weight of all broker_to_escort edges
    const { data: brokerNodes } = await supabase
        .from('graph_nodes')
        .select('node_id, entity_id')
        .eq('node_type', 'broker');

    for (const broker of (brokerNodes || [])) {
        const { data: edges } = await supabase
            .from('graph_edges')
            .select('weight')
            .eq('from_node_id', broker.node_id)
            .eq('edge_type', 'broker_to_escort');

        if (edges && edges.length > 0) {
            const avgWeight = edges.reduce((sum: number, e: any) => sum + e.weight, 0) / edges.length;
            const stabilityBonus = Math.min(0.2, edges.length * 0.02);
            const trustScore = Math.min(1.0, avgWeight + stabilityBonus);

            await supabase.from('graph_scores').upsert({
                entity_id: broker.entity_id,
                score_type: 'broker_trust',
                score_value: Math.round(trustScore * 10000) / 10000,
                computed_at: new Date().toISOString(),
                metadata_json: { edgeCount: edges.length, avgWeight },
            }, { onConflict: 'entity_id,score_type' });

            scoresComputed++;
        }
    }

    // 2. Escort Reliability Score
    // = weighted sum of incoming edges (broker, carrier)
    const { data: escortNodes } = await supabase
        .from('graph_nodes')
        .select('node_id, entity_id')
        .eq('node_type', 'escort_operator');

    for (const escort of (escortNodes || [])) {
        const { data: inEdges } = await supabase
            .from('graph_edges')
            .select('weight, edge_type')
            .eq('to_node_id', escort.node_id)
            .in('edge_type', ['broker_to_escort', 'carrier_to_escort']);

        if (inEdges && inEdges.length > 0) {
            const avgWeight = inEdges.reduce((sum: number, e: any) => sum + e.weight, 0) / inEdges.length;
            const diversityBonus = Math.min(0.15, inEdges.length * 0.015);
            const reliabilityScore = Math.min(1.0, avgWeight + diversityBonus);

            await supabase.from('graph_scores').upsert({
                entity_id: escort.entity_id,
                score_type: 'escort_reliability',
                score_value: Math.round(reliabilityScore * 10000) / 10000,
                computed_at: new Date().toISOString(),
                metadata_json: { edgeCount: inEdges.length, avgWeight },
            }, { onConflict: 'entity_id,score_type' });

            // Also update the unified trust signal
            await supabase.from('operator_trust_signals').upsert({
                operator_id: escort.entity_id,
                graph_reliability_score: reliabilityScore,
                graph_broker_edges: inEdges.length,
            }, { onConflict: 'operator_id' });

            scoresComputed++;
        }
    }

    // 3. Corridor Supply Strength
    // = count of escort_to_corridor edges × avg weight
    const { data: corridorNodes } = await supabase
        .from('graph_nodes')
        .select('node_id, entity_id')
        .eq('node_type', 'corridor');

    for (const corridor of (corridorNodes || [])) {
        const { data: inEdges } = await supabase
            .from('graph_edges')
            .select('weight')
            .eq('to_node_id', corridor.node_id)
            .eq('edge_type', 'escort_to_corridor');

        if (inEdges && inEdges.length > 0) {
            const totalWeight = inEdges.reduce((sum: number, e: any) => sum + e.weight, 0);
            const supplyStrength = Math.min(1.0, totalWeight / 10);

            await supabase.from('graph_scores').upsert({
                entity_id: corridor.entity_id,
                score_type: 'corridor_supply_strength',
                score_value: Math.round(supplyStrength * 10000) / 10000,
                computed_at: new Date().toISOString(),
                metadata_json: { escortCount: inEdges.length, totalWeight },
            }, { onConflict: 'entity_id,score_type' });

            scoresComputed++;
        }
    }

    return { scoresComputed, errors };
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════

/** Get top escorts for a broker on a specific corridor */
export async function getTopEscortsForBroker(
    brokerId: string,
    corridorEntityId: string,
    limit: number = 5,
): Promise<Array<{ escortEntityId: string; score: number }>> {
    const supabase = getSupabase();

    // Get the broker's node
    const { data: brokerNode } = await supabase
        .from('graph_nodes')
        .select('node_id')
        .eq('node_type', 'broker')
        .eq('entity_id', brokerId)
        .single();

    if (!brokerNode) return [];

    // Get corridor's node
    const { data: corridorNode } = await supabase
        .from('graph_nodes')
        .select('node_id')
        .eq('node_type', 'corridor')
        .eq('entity_id', corridorEntityId)
        .single();

    if (!corridorNode) return [];

    // Find escorts that have edges to both broker AND corridor
    const { data: brokerEdges } = await supabase
        .from('graph_edges')
        .select('to_node_id, weight')
        .eq('from_node_id', brokerNode.node_id)
        .eq('edge_type', 'broker_to_escort')
        .order('weight', { ascending: false });

    const { data: corridorEdges } = await supabase
        .from('graph_edges')
        .select('from_node_id, weight')
        .eq('to_node_id', corridorNode.node_id)
        .eq('edge_type', 'escort_to_corridor');

    if (!brokerEdges || !corridorEdges) return [];

    const corridorEscortMap = new Map(corridorEdges.map((e: any) => [e.from_node_id, e.weight]));

    // Score = 0.6 * broker_weight + 0.4 * corridor_weight
    const recommendations: Array<{ nodeId: string; score: number }> = [];

    for (const be of brokerEdges) {
        const corridorWeight = corridorEscortMap.get(be.to_node_id);
        if (corridorWeight !== undefined) {
            const combinedScore = (be.weight * 0.6) + (corridorWeight * 0.4);
            recommendations.push({ nodeId: be.to_node_id, score: combinedScore });
        }
    }

    recommendations.sort((a, b) => b.score - a.score);
    const top = recommendations.slice(0, limit);

    // Resolve entity IDs
    const results: Array<{ escortEntityId: string; score: number }> = [];
    for (const rec of top) {
        const { data: node } = await supabase
            .from('graph_nodes')
            .select('entity_id')
            .eq('node_id', rec.nodeId)
            .single();

        if (node) {
            results.push({
                escortEntityId: node.entity_id,
                score: Math.round(rec.score * 10000) / 10000,
            });
        }
    }

    return results;
}
