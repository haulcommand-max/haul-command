import { ImageResponse } from 'next/og';
// Removed edge runtime due to Vercel production 404 issues

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic props from url query params
    const title = searchParams.get('title') || 'Heavy Haul Operator';
    const location = searchParams.get('location') || 'North America';
    const score = searchParams.get('score');
    const isClaimed = searchParams.get('claimed') === 'true';

    // Haul Command Brand aesthetics
    const bgGradient = 'linear-gradient(to bottom right, #0a0a0a, #111111, #1a1a1a)';
    const goldColor = '#fbbf24'; // amber-400
    const goldGlow = '0 0 40px rgba(251, 191, 36, 0.4)';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundImage: bgGradient,
            padding: '80px',
            fontFamily: 'sans-serif',
            color: 'white',
          }}
        >
          {/* Top border brand accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '12px',
              backgroundColor: goldColor,
            }}
          />

          {/* Logo / Brand Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                letterSpacing: '4px',
                color: goldColor,
                textTransform: 'uppercase',
                display: 'flex',
                boxShadow: goldGlow,
              }}
            >
              HAUL COMMAND OS
            </div>
            <div
              style={{
                marginLeft: '16px',
                padding: '4px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                fontSize: 18,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#aaaaaa',
              }}
            >
              Intelligence Matrix
            </div>
          </div>

          {/* Main Content Area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '80px',
            }}
          >
            <h1
              style={{
                fontSize: 84,
                fontWeight: 900,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '24px',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
              {/* Location Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 32,
                  color: '#dddddd',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  padding: '12px 32px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ marginRight: '12px' }}>📍</span>
                {location}
              </div>

              {/* AI Score Badge */}
              {score && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: goldColor,
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    padding: '12px 32px',
                    borderRadius: '16px',
                    marginLeft: '24px',
                    border: `1px solid rgba(251, 191, 36, 0.3)`,
                  }}
                >
                  <span style={{ marginRight: '12px' }}>⭐</span>
                  {score} AI Rank
                </div>
              )}

              {/* Verified Badge */}
              {isClaimed && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: '#10b981', // green-500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '12px 32px',
                    borderRadius: '16px',
                    marginLeft: '24px',
                    border: `1px solid rgba(16, 185, 129, 0.3)`,
                  }}
                >
                  <span style={{ marginRight: '12px' }}>✓</span>
                  Verified Operator
                </div>
              )}

            </div>
          </div>

          {/* Value Prop Banner */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              fontSize: 24,
              color: '#888888',
            }}
          >
            The canonical directory for superload logistics. Access real-time escort availability.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(`OG Gen Error: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
