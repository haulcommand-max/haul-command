import { NextResponse } from 'next/server';

// Haul Command Static Map Generator
// Generates static map images (PNG URLs) for email/SMS notifications.
// "Your escort is 30 minutes away" + a clean map thumbnail showing their position.
// Uses Mapbox Static Images API — zero browser, zero JS, works in email clients.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const lng = searchParams.get('lng');
    const lat = searchParams.get('lat');
    const zoom = searchParams.get('zoom') || '10';
    const width = searchParams.get('w') || '600';
    const height = searchParams.get('h') || '300';
    const style = searchParams.get('style') || 'dark-v11'; // HC brand = dark
    const marker = searchParams.get('marker') === 'false' ? false : true;
    const routeGeoJson = searchParams.get('route'); // optional GeoJSON LineString

    if (!lng || !lat) {
        return NextResponse.json({
            error: 'Coordinates (lat, lng) required.',
        }, { status: 400 });
    }

    // Build the overlay string
    let overlay = '';
    if (marker) {
        // Custom pin in Haul Command gold (#C6923A)
        overlay = `pin-l-truck+C6923A(${lng},${lat})`;
    }

    // If a route GeoJSON is provided, add it as a path overlay
    if (routeGeoJson) {
        try {
            const routeData = JSON.parse(routeGeoJson);
            if (routeData.coordinates && routeData.coordinates.length >= 2) {
                // Mapbox path overlay format: path-{stroke_width}+{color}-{opacity}({coords})
                const pathCoords = routeData.coordinates
                    .slice(0, 50) // Limit to 50 points for URL length constraint
                    .map((c: number[]) => `${c[0]},${c[1]}`)
                    .join(',');
                overlay = `path-4+C6923A-0.8(${encodeURIComponent(pathCoords)})${marker ? ',' : ''}${marker ? `pin-l-truck+C6923A(${lng},${lat})` : ''}`;
            }
        } catch {
            // If GeoJSON parse fails, just use the marker
        }
    }

    // Construct the Mapbox Static Images URL
    const staticUrl = overlay
        ? `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlay}/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`
        : `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

    // Option 1: Redirect to the Mapbox static image URL (for email <img> tags)
    // Option 2: Proxy the image through our server (for token protection)
    const proxyMode = searchParams.get('proxy') === 'true';

    if (proxyMode) {
        // Proxy mode: fetch the image and return it directly (hides the token)
        const imageResponse = await fetch(staticUrl);
        if (!imageResponse.ok) {
            return NextResponse.json({ error: 'Static image generation failed.' }, { status: 502 });
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            },
        });
    }

    // Non-proxy mode: return the URL (client can use it in <img> tags)
    return NextResponse.json({
        success: true,
        image_url: staticUrl,
        dimensions: { width: parseInt(width), height: parseInt(height), retina: true },
        usage: {
            html_email: `<img src="${staticUrl}" alt="Escort Location Map" width="${width}" height="${height}" />`,
            sms_deeplink: `https://www.haulcommand.com/map?lat=${lat}&lng=${lng}`,
        }
    });
}
