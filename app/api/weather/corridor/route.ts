/**
 * GET /api/weather/corridor?lat=&lon=&corridor=
 * 
 * Returns weather alerts for a corridor using OpenWeatherMap free API.
 * Flags: high winds (>35mph), heavy rain, ice/snow, extreme heat.
 * 
 * Used by: corridor pages, map overlay, push notifications
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const OWM_KEY = process.env.OPENWEATHERMAP_API_KEY || process.env.OWM_API_KEY || '';

interface WeatherAlert {
  type: 'wind' | 'rain' | 'ice' | 'snow' | 'heat' | 'fog' | 'storm';
  severity: 'low' | 'medium' | 'high';
  message: string;
  temp?: number;
  windSpeed?: number;
  description?: string;
}

function analyzeWeather(data: any): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  if (!data?.list) return alerts;

  for (const entry of data.list.slice(0, 8)) {
    const temp = entry.main?.temp;
    const wind = entry.wind?.speed;
    const weather = entry.weather?.[0];
    const dt = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // High winds (>35 mph = ~15.6 m/s)
    if (wind && wind > 15.6) {
      alerts.push({
        type: 'wind',
        severity: wind > 22 ? 'high' : 'medium',
        message: `⚠️ High winds ${Math.round(wind * 2.237)} mph on ${dt} — oversize loads may be restricted`,
        windSpeed: Math.round(wind * 2.237),
      });
    }

    // Ice / Snow
    if (weather?.main === 'Snow') {
      alerts.push({
        type: 'snow',
        severity: 'high',
        message: `🌨 Snow expected on ${dt} — chain requirements likely, possible road closures`,
        description: weather.description,
      });
    }

    // Freezing temps
    if (temp && temp < 273.15) {
      alerts.push({
        type: 'ice',
        severity: 'high',
        message: `🧊 Below freezing (${Math.round((temp - 273.15) * 9/5 + 32)}°F) on ${dt} — bridge ice risk`,
        temp: Math.round((temp - 273.15) * 9/5 + 32),
      });
    }

    // Extreme heat
    if (temp && temp > 311) { // 100°F
      alerts.push({
        type: 'heat',
        severity: 'medium',
        message: `🔥 Extreme heat ${Math.round((temp - 273.15) * 9/5 + 32)}°F on ${dt} — tire pressure risk, load integrity concerns`,
        temp: Math.round((temp - 273.15) * 9/5 + 32),
      });
    }

    // Heavy rain / thunderstorm
    if (weather?.main === 'Thunderstorm') {
      alerts.push({
        type: 'storm',
        severity: 'high',
        message: `⛈ Thunderstorms expected on ${dt} — potential convoy delays`,
        description: weather.description,
      });
    }

    if (weather?.main === 'Rain' && weather?.description?.includes('heavy')) {
      alerts.push({
        type: 'rain',
        severity: 'medium',
        message: `🌧 Heavy rain on ${dt} — reduced visibility, longer travel times`,
        description: weather.description,
      });
    }
  }

  // Deduplicate by type
  const seen = new Set<string>();
  return alerts.filter(a => {
    const key = `${a.type}-${a.severity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat') || '32.7767'; // Default: Dallas
  const lon = searchParams.get('lon') || '-96.7970';
  const corridor = searchParams.get('corridor') || 'Unknown';

  // Return mock data if no API key
  if (!OWM_KEY) {
    return NextResponse.json({
      ok: true,
      corridor,
      alerts: [
        { type: 'wind', severity: 'medium', message: '⚠️ Moderate winds 28 mph expected Thursday — monitor oversize restrictions' },
      ],
      source: 'fallback',
      note: 'Set OPENWEATHERMAP_API_KEY for live data (free at openweathermap.org)',
    });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&cnt=16`,
      { next: { revalidate: 1800 } } // Cache 30 min
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Weather API error (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const alerts = analyzeWeather(data);

    return NextResponse.json({
      ok: true,
      corridor,
      location: data.city?.name || 'Unknown',
      alerts,
      forecastCount: data.list?.length || 0,
      source: 'openweathermap',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Weather fetch failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
