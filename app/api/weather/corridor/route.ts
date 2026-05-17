/**
 * GET /api/weather/corridor?lat=&lon=&corridor=
 *
 * Returns weather alerts for a corridor using OpenWeatherMap when configured.
 * Without a live source, returns an empty unavailable result instead of fake alerts.
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
    const dt = new Date(entry.dt * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (wind && wind > 15.6) {
      alerts.push({
        type: 'wind',
        severity: wind > 22 ? 'high' : 'medium',
        message: `High winds ${Math.round(wind * 2.237)} mph on ${dt}; oversize loads may be restricted.`,
        windSpeed: Math.round(wind * 2.237),
      });
    }

    if (weather?.main === 'Snow') {
      alerts.push({
        type: 'snow',
        severity: 'high',
        message: `Snow expected on ${dt}; chain requirements or road closures may apply.`,
        description: weather.description,
      });
    }

    if (temp && temp < 273.15) {
      alerts.push({
        type: 'ice',
        severity: 'high',
        message: `Below freezing (${Math.round((temp - 273.15) * 9 / 5 + 32)}F) on ${dt}; bridge ice risk.`,
        temp: Math.round((temp - 273.15) * 9 / 5 + 32),
      });
    }

    if (temp && temp > 311) {
      alerts.push({
        type: 'heat',
        severity: 'medium',
        message: `Extreme heat ${Math.round((temp - 273.15) * 9 / 5 + 32)}F on ${dt}; tire pressure and load integrity risk.`,
        temp: Math.round((temp - 273.15) * 9 / 5 + 32),
      });
    }

    if (weather?.main === 'Thunderstorm') {
      alerts.push({
        type: 'storm',
        severity: 'high',
        message: `Thunderstorms expected on ${dt}; convoy delays may occur.`,
        description: weather.description,
      });
    }

    if (weather?.main === 'Rain' && weather?.description?.includes('heavy')) {
      alerts.push({
        type: 'rain',
        severity: 'medium',
        message: `Heavy rain on ${dt}; expect reduced visibility and longer travel times.`,
        description: weather.description,
      });
    }
  }

  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = `${alert.type}-${alert.severity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const corridor = searchParams.get('corridor') || 'Unknown';

  if (!lat || !lon) {
    return NextResponse.json(
      { ok: false, error: 'lat and lon are required for corridor weather lookup' },
      { status: 400 }
    );
  }

  if (!OWM_KEY) {
    return NextResponse.json({
      ok: true,
      corridor,
      alerts: [],
      source: 'unconfigured',
      source_confidence: 'unavailable',
      note: 'Weather alerts are unavailable until OPENWEATHERMAP_API_KEY or OWM_API_KEY is configured.',
    });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&cnt=16`,
      { next: { revalidate: 1800 } }
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
      source_confidence: 'live_api',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Weather fetch failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
