/**
 * HC Route — Permit OCR Pipeline
 * POST /api/hc-route/permit-digitize
 *
 * Flow: Upload permit PDF → Extract text → LLM parse → Geocode waypoints → Save to permit_routes
 *
 * Requires: OPENAI_API_KEY in environment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- PDF TEXT EXTRACTION (pure JS, no external binary) ---
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // For production: use pdf-parse, pdf.js, or Supabase Storage + Google Vision
  // This impl handles text-based PDFs; scanned PDFs need OCR service
  try {
    const { default: pdfParse } = await import('pdf-parse');
    const result = await pdfParse(Buffer.from(buffer));
    return result.text;
  } catch {
    // Fallback: basic text extraction from PDF bytes
    const text = Buffer.from(buffer).toString('utf-8');
    const cleaned = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ');
    return cleaned;
  }
}

// --- LLM PARSING (OpenAI) ---
interface ParsedPermit {
  permitNumber: string;
  issuingState: string;
  permitType: 'single_trip' | 'annual' | 'multi_trip' | 'superload';
  permittedHeight?: number;
  permittedWidth?: number;
  permittedLength?: number;
  permittedWeight?: number;
  origin: string;
  destination: string;
  routeDescription: string[];
  travelTimeStart?: string;
  travelTimeEnd?: string;
  noTravelDays?: string[];
  maxSpeed?: number;
  validFrom: string;
  validUntil: string;
}

async function parsePermitWithLLM(text: string): Promise<ParsedPermit> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert at parsing oversize/overweight load permits. Extract structured data from the permit text. Return JSON with these fields:
- permitNumber (string)
- issuingState (2-letter state code)
- permitType ("single_trip", "annual", "multi_trip", or "superload")
- permittedHeight (number in feet, null if not specified)
- permittedWidth (number in feet, null if not specified)
- permittedLength (number in feet, null if not specified)
- permittedWeight (number in lbs, null if not specified)
- origin (full address string)
- destination (full address string)
- routeDescription (array of strings, each a road/direction instruction like "I-35 South to Exit 42", "Left on FM 1431", etc.)
- travelTimeStart (HH:MM 24hr format or null)
- travelTimeEnd (HH:MM 24hr format or null)
- noTravelDays (array like ["Saturday", "Sunday"] or null)
- maxSpeed (mph number or null)
- validFrom (YYYY-MM-DD)
- validUntil (YYYY-MM-DD)

Convert all measurements to imperial (feet/lbs). If a value is ambiguous, make your best interpretation.`
        },
        { role: 'user', content: `Parse this permit:\n\n${text.substring(0, 8000)}` }
      ],
      temperature: 0.1,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// --- GEOCODING ---
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Use HERE Maps (already in the stack) or fallback to Nominatim
  const hereKey = process.env.HERE_API_KEY;
  if (hereKey) {
    const res = await fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apiKey=${hereKey}`);
    const data = await res.json();
    if (data.items?.[0]) {
      return { lat: data.items[0].position.lat, lng: data.items[0].position.lng };
    }
  }

  // Fallback: Nominatim (free, no key)
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
    headers: { 'User-Agent': 'HaulCommand/1.0' },
  });
  const data = await res.json();
  if (data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

async function geocodeRouteStep(step: string, state: string): Promise<{ lat: number; lng: number } | null> {
  return geocodeAddress(`${step}, ${state}, USA`);
}

// --- API HANDLER ---
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('permit') as File;
    const operatorId = formData.get('operator_id') as string;
    const vehicleProfileId = formData.get('vehicle_profile_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No permit file uploaded' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    // Step 1: Extract text from PDF
    const buffer = await file.arrayBuffer();
    const rawText = await extractTextFromPDF(buffer);

    if (rawText.length < 50) {
      return NextResponse.json({ error: 'Could not extract text from PDF. It may be a scanned image — OCR support coming soon.' }, { status: 422 });
    }

    // Step 2: Parse with LLM
    const parsed = await parsePermitWithLLM(rawText);

    // Step 3: Geocode origin and destination
    const originGeo = await geocodeAddress(parsed.origin);
    const destGeo = await geocodeAddress(parsed.destination);

    // Step 4: Geocode route waypoints
    const waypoints = [];
    for (let i = 0; i < parsed.routeDescription.length; i++) {
      const geo = await geocodeRouteStep(parsed.routeDescription[i], parsed.issuingState);
      waypoints.push({
        lat: geo?.lat || 0,
        lng: geo?.lng || 0,
        instruction: parsed.routeDescription[i],
        roadName: parsed.routeDescription[i],
        sequence: i + 1,
      });
      // Rate limit geocoding
      await new Promise(r => setTimeout(r, 200));
    }

    // Step 5: Upload PDF to Supabase Storage
    const pdfPath = `permits/${operatorId}/${parsed.permitNumber}.pdf`;
    await supabase.storage.from('hc-route-permits').upload(pdfPath, Buffer.from(buffer), {
      contentType: 'application/pdf', upsert: true,
    });
    const { data: urlData } = supabase.storage.from('hc-route-permits').getPublicUrl(pdfPath);

    // Step 6: Insert into permit_routes
    const { data: route, error } = await supabase.from('permit_routes').insert({
      operator_id: operatorId || null,
      vehicle_profile_id: vehicleProfileId || null,
      permit_number: parsed.permitNumber,
      issuing_state: parsed.issuingState,
      permit_type: parsed.permitType,
      permitted_height_ft: parsed.permittedHeight,
      permitted_width_ft: parsed.permittedWidth,
      permitted_length_ft: parsed.permittedLength,
      permitted_weight_lbs: parsed.permittedWeight,
      origin_address: parsed.origin,
      origin_lat: originGeo?.lat,
      origin_lng: originGeo?.lng,
      destination_address: parsed.destination,
      destination_lat: destGeo?.lat,
      destination_lng: destGeo?.lng,
      waypoints: waypoints,
      travel_time_start: parsed.travelTimeStart,
      travel_time_end: parsed.travelTimeEnd,
      no_travel_days: parsed.noTravelDays,
      max_speed_mph: parsed.maxSpeed,
      permit_pdf_url: urlData?.publicUrl,
      permit_raw_text: rawText.substring(0, 10000),
      valid_from: parsed.validFrom,
      valid_until: parsed.validUntil,
      route_validated: false,
      restrictions_checked: false,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      permitRoute: route,
      parsed,
      waypointCount: waypoints.length,
      geocodedOrigin: originGeo,
      geocodedDestination: destGeo,
    });

  } catch (err: any) {
    console.error('Permit digitize error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
