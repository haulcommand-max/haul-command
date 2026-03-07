/**
 * Photo AI — Escort Vehicle Detection (TypeScript orchestration layer)
 * 
 * This module coordinates image acquisition from allowed sources,
 * dispatches to the Python detection service, and persists results.
 * 
 * The actual detection runs in Python (services/photo_ai/detect_escort_signals.py)
 * using YOLO + EasyOCR. This TS module handles the pipeline glue.
 * 
 * Allowed image sources:
 *   PREFERRED:  claimed profile uploads (operators upload their own photos)
 *   CONDITIONAL: Google Places photos via official API (respect terms, TTL, caching)
 *   FORBIDDEN:  scraping Google Maps UI images
 * 
 * Scoring formula:
 *   photo_signal_score = 0.55*object_detection_confidence + 0.30*ocr_keyword_confidence + 0.15*multi_photo_consistency
 * 
 * Thresholds:
 *   strong_evidence: ≥ 0.78
 *   medium_evidence: ≥ 0.62
 *   weak_evidence:   ≥ 0.48
 */

import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PhotoDetectionResult {
    objectLabels: Array<{ label: string; confidence: number }>;
    ocrHits: Record<string, number>;   // keyword → confidence
    rawScore: number;
}

export interface PhotoSignalResult {
    operatorId: string;
    photoSignalScore: number;
    evidenceTopLabels: Array<{ label: string; confidence: number }>;
    ocrHits: Record<string, number>;
    sampleImageRefs: string[];
    imagesScanned: number;
    provenance: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// SCORING (mirrors Python implementation)
// ═══════════════════════════════════════════════════════════════

const RELEVANT_OBJECT_LABELS = new Set([
    'pickup_truck', 'suv', 'amber_lightbar',
    'oversize_banner_front', 'oversize_banner_rear',
    'pilot_car_sign', 'traffic_cones', 'escort_decals',
]);

const THRESHOLDS = {
    strongEvidence: 0.78,
    mediumEvidence: 0.62,
    weakEvidence: 0.48,
};

/**
 * Compute photo signal score from detection results across multiple images.
 * Uses multi-photo consistency as a bonus signal.
 */
export function computePhotoSignalScore(detections: PhotoDetectionResult[]): number {
    if (detections.length === 0) return 0;

    // Best object detection confidence across all images
    let bestObjConf = 0;
    for (const det of detections) {
        for (const { label, confidence } of det.objectLabels) {
            if (RELEVANT_OBJECT_LABELS.has(label)) {
                bestObjConf = Math.max(bestObjConf, confidence);
            }
        }
    }

    // Best OCR keyword confidence across all images
    let bestOcrConf = 0;
    for (const det of detections) {
        const maxOcr = Object.values(det.ocrHits).reduce((max, v) => Math.max(max, v), 0);
        bestOcrConf = Math.max(bestOcrConf, maxOcr);
    }

    // Multi-photo consistency: if 2+ images have relevant signals, boost
    const imagesWithSignals = detections.filter(d =>
        d.objectLabels.some(l => RELEVANT_OBJECT_LABELS.has(l.label) && l.confidence > 0.4) ||
        Object.values(d.ocrHits).some(v => v > 0.4)
    ).length;

    const consistencyScore = detections.length > 1
        ? Math.min(1.0, imagesWithSignals / detections.length)
        : 0.5;

    // Weighted formula
    const score = (0.55 * bestObjConf) + (0.30 * bestOcrConf) + (0.15 * consistencyScore);
    return Math.round(Math.min(1.0, Math.max(0, score)) * 10000) / 10000;
}

export function getEvidenceLevel(score: number): 'strong' | 'medium' | 'weak' | 'none' {
    if (score >= THRESHOLDS.strongEvidence) return 'strong';
    if (score >= THRESHOLDS.mediumEvidence) return 'medium';
    if (score >= THRESHOLDS.weakEvidence) return 'weak';
    return 'none';
}

// ═══════════════════════════════════════════════════════════════
// IMAGE SOURCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export interface ImageRef {
    url: string;
    source: 'claimed_upload' | 'google_api' | 'partner';
    operatorId: string;
}

/** Get scannable images for an operator from allowed sources */
export async function getOperatorImages(operatorId: string): Promise<ImageRef[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const images: ImageRef[] = [];

    // Source 1: Claimed profile uploads (preferred)
    const { data: uploads } = await supabase
        .storage
        .from('operator-photos')
        .list(`${operatorId}/`, { limit: 10 });

    if (uploads) {
        for (const file of uploads) {
            if (file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                const { data: signedUrl } = await supabase
                    .storage
                    .from('operator-photos')
                    .createSignedUrl(`${operatorId}/${file.name}`, 3600);

                if (signedUrl) {
                    images.push({
                        url: signedUrl.signedUrl,
                        source: 'claimed_upload',
                        operatorId,
                    });
                }
            }
        }
    }

    return images;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE JOB: Scan operator photos
// ═══════════════════════════════════════════════════════════════

/**
 * Process photo detection results and persist to DB.
 * In production, the actual detection is done by the Python service —
 * this handles the results and trust signal updates.
 */
export async function persistPhotoSignals(result: PhotoSignalResult): Promise<void> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert photo signals
    await supabase.from('operator_photo_signals').upsert({
        operator_id: result.operatorId,
        photo_signal_score: result.photoSignalScore,
        evidence_top_labels_json: result.evidenceTopLabels,
        ocr_hits_json: result.ocrHits,
        sample_image_refs_json: result.sampleImageRefs,
        images_scanned: result.imagesScanned,
        last_scanned_at: new Date().toISOString(),
        provenance_json: result.provenance,
    }, { onConflict: 'operator_id' });

    // Update unified trust signal
    await supabase.from('operator_trust_signals').upsert({
        operator_id: result.operatorId,
        photo_signal_score: result.photoSignalScore,
    }, { onConflict: 'operator_id' });

    // If strong/medium evidence → add to hidden escort candidates
    if (result.photoSignalScore >= THRESHOLDS.mediumEvidence) {
        await supabase.from('hidden_escort_candidates').upsert({
            operator_id: result.operatorId,
            discovery_source: 'photo_ai',
            photo_signal: result.photoSignalScore,
            composite_score: result.photoSignalScore,
            status: 'pending',
        }, { onConflict: 'operator_id' }); // May need unique constraint
    }
}
