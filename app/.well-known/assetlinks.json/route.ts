import { NextResponse } from 'next/server';

/**
 * Digital Asset Links for Android App Links verification.
 * Serves at: https://haulcommand.com/.well-known/assetlinks.json
 *
 * This allows Android to verify that the app (com.haulcommand.app) is
 * authorized to handle universal links for haulcommand.com.
 *
 * IMPORTANT: Replace the sha256_cert_fingerprints with your actual
 * signing key fingerprint. Get it with:
 *   keytool -list -v -keystore your-release-key.keystore
 *   (or from Play Console → Setup → App signing → SHA-256 fingerprint)
 */

const ASSET_LINKS = [
    {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
            namespace: 'android_app',
            package_name: 'com.haulcommand.app',
            sha256_cert_fingerprints: [
                // TODO: Replace with your release signing key SHA-256 fingerprint
                // Debug key (for testing):
                // Run: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
                'PLACEHOLDER:REPLACE_WITH_YOUR_SHA256_FINGERPRINT',
            ],
        },
    },
];

export async function GET() {
    return NextResponse.json(ASSET_LINKS, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400',
        },
    });
}
