/**
 * Haul Command — Camera & Evidence Upload Engine
 *
 * Uses @capacitor/camera to capture photos on native devices.
 * Uploads to Supabase Storage evidence bucket with metadata.
 * Queue-based: if offline, stores base64 locally and flushes on reconnect.
 */

import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { createClient } from '@/utils/supabase/client';

// ─── Types ────────────────────────────────────────────────
export type EvidenceType =
    | 'high_pole'
    | 'bridge_strike'
    | 'insurance_card'
    | 'pre_trip_photo'
    | 'route_hazard'
    | 'vehicle_damage'
    | 'compliance_doc';

export interface EvidenceCapture {
    type: EvidenceType;
    loadId?: string;
    notes?: string;
}

export interface EvidenceResult {
    success: boolean;
    path?: string;
    url?: string;
    error?: string;
}

interface QueuedUpload {
    base64Data: string;
    format: string;
    metadata: EvidenceCapture;
    capturedAt: string;
    userId: string;
}

// ─── Constants ────────────────────────────────────────────
const EVIDENCE_BUCKET = 'evidence-vault';
const UPLOAD_QUEUE_KEY = 'hc_evidence_upload_queue';

// ─── Queue management ─────────────────────────────────────
function enqueueUpload(item: QueuedUpload): void {
    if (typeof window === 'undefined') return;
    const queue: QueuedUpload[] = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || '[]');
    queue.push(item);
    // Cap at 20 photos (each ~2-5MB base64)
    if (queue.length > 20) queue.splice(0, queue.length - 20);
    localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
}

function dequeueAll(): QueuedUpload[] {
    if (typeof window === 'undefined') return [];
    const queue: QueuedUpload[] = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || '[]');
    localStorage.removeItem(UPLOAD_QUEUE_KEY);
    return queue;
}

export function getQueuedUploadCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
        return JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || '[]').length;
    } catch { return 0; }
}

// ─── Upload to Supabase Storage ───────────────────────────
async function uploadToStorage(
    base64Data: string,
    format: string,
    metadata: EvidenceCapture,
    capturedAt: string
): Promise<EvidenceResult> {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        // Build path: evidence-vault/{userId}/{type}/{timestamp}.{format}
        const ts = capturedAt.replace(/[:.]/g, '-');
        const ext = format === 'png' ? 'png' : 'jpg';
        const filePath = `${user.id}/${metadata.type}/${ts}.${ext}`;

        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: `image/${ext}` });

        const { error: uploadError } = await supabase.storage
            .from(EVIDENCE_BUCKET)
            .upload(filePath, blob, {
                contentType: `image/${ext}`,
                upsert: false,
            });

        if (uploadError) return { success: false, error: uploadError.message };

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(EVIDENCE_BUCKET)
            .getPublicUrl(filePath);

        // Log evidence artifact in DB
        await supabase.from('evidence_artifacts').insert({
            user_id: user.id,
            load_id: metadata.loadId ?? null,
            evidence_type: metadata.type,
            storage_path: filePath,
            notes: metadata.notes ?? null,
            captured_at: capturedAt,
        }).single();

        return {
            success: true,
            path: filePath,
            url: urlData.publicUrl,
        };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}

// ─── Capture photo ────────────────────────────────────────
export async function captureEvidence(
    evidence: EvidenceCapture
): Promise<EvidenceResult> {
    try {
        let photo: Photo;

        if (Capacitor.isNativePlatform()) {
            // Native camera
            photo = await Camera.getPhoto({
                quality: 85,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera,
                saveToGallery: false,
                width: 1920,
                height: 1080,
            });
        } else {
            // Web fallback: file picker
            photo = await Camera.getPhoto({
                quality: 85,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos,
                width: 1920,
                height: 1080,
            });
        }

        if (!photo.base64String) {
            return { success: false, error: 'No photo data captured' };
        }

        const capturedAt = new Date().toISOString();

        // Try immediate upload
        if (navigator.onLine) {
            return await uploadToStorage(
                photo.base64String,
                photo.format,
                evidence,
                capturedAt
            );
        } else {
            // Queue for later
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                enqueueUpload({
                    base64Data: photo.base64String,
                    format: photo.format,
                    metadata: evidence,
                    capturedAt,
                    userId: user.id,
                });
            }
            return { success: true, error: 'Queued for upload (offline)' };
        }
    } catch (err) {
        return { success: false, error: String(err) };
    }
}

// ─── Flush upload queue ───────────────────────────────────
export async function flushEvidenceQueue(): Promise<number> {
    const queue = dequeueAll();
    if (!queue.length) return 0;

    let uploaded = 0;
    for (const item of queue) {
        const result = await uploadToStorage(
            item.base64Data,
            item.format,
            item.metadata,
            item.capturedAt
        );
        if (result.success) uploaded++;
        else enqueueUpload(item); // re-queue failures
    }
    return uploaded;
}

// ─── Auto-flush on reconnect ──────────────────────────────
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        flushEvidenceQueue().then(n => {
            if (n > 0) console.log(`[evidence-vault] Uploaded ${n} queued photos`);
        });
    });
}
