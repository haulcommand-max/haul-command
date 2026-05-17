import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || 'live_map';
    const traccarUrl = process.env.TRACCAR_API_URL;
    const traccarToken = process.env.TRACCAR_API_TOKEN;

    try {
        if (!traccarUrl || !traccarToken) {
            return NextResponse.json([], {
                headers: {
                    'x-hc-source': 'traccar_not_configured',
                    'x-hc-device-group': group,
                },
            });
        }

        const response = await fetch(`${traccarUrl.replace(/\/$/, '')}/api/devices`, {
            headers: {
                Authorization: `Bearer ${traccarToken}`,
                Accept: 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json([], {
                status: 502,
                headers: {
                    'x-hc-source': 'traccar_proxy_error',
                    'x-hc-device-group': group,
                },
            });
        }

        const devices = await response.json();
        return NextResponse.json(Array.isArray(devices) ? devices : [], {
            headers: {
                'x-hc-source': 'traccar_api',
                'x-hc-device-group': group,
            },
        });
    } catch (error) {
        console.error('[Traccar Proxy] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
