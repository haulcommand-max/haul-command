/**
 * POST /api/photos/upload
 * 
 * Handles operator photo/document uploads to Supabase Storage.
 * Returns the public URL for use in profile updates.
 * 
 * Supports: avatar, logo, banner, documents (insurance, license, etc.)
 * Max size: 5MB for photos, 10MB for documents
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceSupabase() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;  // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024;   // 10MB

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_DOC_TYPES = [...ALLOWED_PHOTO_TYPES, 'application/pdf'];

const UPLOAD_TYPES: Record<string, { bucket: string; folder: string; maxSize: number; allowedTypes: string[] }> = {
    avatar: { bucket: 'operator-photos', folder: 'avatars', maxSize: MAX_PHOTO_SIZE, allowedTypes: ALLOWED_PHOTO_TYPES },
    logo: { bucket: 'operator-photos', folder: 'logos', maxSize: MAX_PHOTO_SIZE, allowedTypes: ALLOWED_PHOTO_TYPES },
    banner: { bucket: 'operator-photos', folder: 'banners', maxSize: MAX_PHOTO_SIZE, allowedTypes: ALLOWED_PHOTO_TYPES },
    insurance: { bucket: 'operator-documents', folder: 'insurance', maxSize: MAX_DOC_SIZE, allowedTypes: ALLOWED_DOC_TYPES },
    license: { bucket: 'operator-documents', folder: 'licenses', maxSize: MAX_DOC_SIZE, allowedTypes: ALLOWED_DOC_TYPES },
    certification: { bucket: 'operator-documents', folder: 'certifications', maxSize: MAX_DOC_SIZE, allowedTypes: ALLOWED_DOC_TYPES },
    vehicle: { bucket: 'operator-photos', folder: 'vehicles', maxSize: MAX_PHOTO_SIZE, allowedTypes: ALLOWED_PHOTO_TYPES },
};

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const uploadType = formData.get('type') as string | null;
        const operatorId = formData.get('operatorId') as string | null;

        if (!file || !uploadType || !operatorId) {
            return NextResponse.json({ error: 'file, type, and operatorId required' }, { status: 400 });
        }

        const config = UPLOAD_TYPES[uploadType];
        if (!config) {
            return NextResponse.json({ error: `Invalid upload type: ${uploadType}` }, { status: 400 });
        }

        // Verify ownership
        const serviceSupabase = getServiceSupabase();
        const { data: operator } = await serviceSupabase
            .from('operators')
            .select('id, user_id')
            .eq('id', operatorId)
            .single();

        if (!operator || operator.user_id !== user.id) {
            return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
        }

        // Validate file
        if (file.size > config.maxSize) {
            return NextResponse.json({
                error: `File too large. Max ${config.maxSize / (1024 * 1024)}MB.`,
            }, { status: 400 });
        }

        if (!config.allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: `File type ${file.type} not allowed. Accepted: ${config.allowedTypes.join(', ')}`,
            }, { status: 400 });
        }

        // Upload to Supabase Storage
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${config.folder}/${operatorId}/${Date.now()}.${ext}`;

        const buffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await serviceSupabase
            .storage
            .from(config.bucket)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('[UPLOAD] Storage error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = serviceSupabase
            .storage
            .from(config.bucket)
            .getPublicUrl(uploadData.path);

        // Auto-update the profile field for photos
        if (['avatar', 'logo', 'banner'].includes(uploadType)) {
            const fieldMap: Record<string, string> = {
                avatar: 'avatar_url',
                logo: 'logo_url',
                banner: 'banner_url',
            };
            await serviceSupabase
                .from('operators')
                .update({ [fieldMap[uploadType]]: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', operatorId);
        }

        // Log document submissions for verification pipeline
        if (['insurance', 'license', 'certification'].includes(uploadType)) {
            await serviceSupabase.from('document_submissions').insert({
                operator_id: operatorId,
                document_type: uploadType,
                file_url: publicUrl,
                status: 'pending_review',
                submitted_at: new Date().toISOString(),
                submitted_by: user.id,
            });
        }

        // PostHog
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                        distinct_id: user.id,
                        event: 'file_uploaded',
                        properties: { operator_id: operatorId, type: uploadType, size: file.size },
                    }),
                });
            } catch { /* non-blocking */ }
        }

        return NextResponse.json({
            ok: true,
            url: publicUrl,
            type: uploadType,
            path: uploadData.path,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        console.error('[UPLOAD] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
