import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || 'live_map';

    try {
        // MOCK: In production, this proxies the Traccar API instance securely 
        // using the environment's TRACCAR_API_KEY.
        // It prevents the frontend from directly contacting port 8082 with credentials.
        
        // Simulating the format of the official Traccar Open-Source response.
        const mockTraccarDevices = [
            {
                id: 1,
                uniqueId: "traccar_oper_mock_1",
                name: "Alpha Heavy Escort",
                status: "online",
                lastUpdate: new Date().toISOString(),
                positionId: 101,
                latitude: 39.8283 + (Math.random() * 0.5),
                longitude: -98.5795 + (Math.random() * 0.5),
                course: 90.0,
                speed: 4.5,
                attributes: {
                    batteryLevel: 98,
                    motion: true
                }
            },
             {
                id: 2,
                uniqueId: "traccar_oper_mock_2",
                name: "Bravo Wide Load Pilot",
                status: "online",
                lastUpdate: new Date().toISOString(),
                positionId: 102,
                latitude: 40.1283 + (Math.random() * 0.5),
                longitude: -96.5795 + (Math.random() * 0.5),
                course: 270.0,
                speed: 0.0,
                attributes: {
                    batteryLevel: 45,
                    motion: false
                }
            }
        ];

        return NextResponse.json(mockTraccarDevices);
    } catch (error) {
        console.error('[Traccar Proxy] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
