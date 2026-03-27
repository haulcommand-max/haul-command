/**
 * Haul Command Load Board Ingestion v3 — Batch Segmenter
 *
 * Detects and classifies each line/block in a mixed-format batch,
 * groups them into typed segments, and routes each segment to the
 * correct parser. Supports:
 *   - alert_line segments (Load Alert!! lines)
 *   - structured_listing segments (multi-line ID Verified blocks)
 *   - date_context segments (date headers)
 *   - noise segments (anything else — preserved, never dropped)
 *
 * Global: country-agnostic, all 120 countries.
 */

import { DATE_HEADER_PATTERNS } from './dictionaries';

// ─── Segment Types ───────────────────────────────────────────────

export type SegmentType =
  | 'alert_line'
  | 'structured_listing'
  | 'date_context'
  | 'noise';

export interface RawLine {
  lineNumber: number;       // 1-indexed from raw text
  text: string;
  trimmed: string;
}

export interface BatchSegment {
  id: string;               // segment_001, segment_002, ...
  type: SegmentType;
  lines: RawLine[];
  rawText: string;
  dateContext: string | null;
  startLine: number;
  endLine: number;
}

export interface SegmentationResult {
  segments: BatchSegment[];
  totalLinesReceived: number;
  totalAlertSegments: number;
  totalStructuredSegments: number;
  totalNoiseSegments: number;
  totalDateSegments: number;
  formatMix: 'alert_only' | 'structured_only' | 'mixed' | 'unknown';
}

// ─── Line Classification ─────────────────────────────────────────

type LineClass =
  | 'alert_line'
  | 'structured_start'     // "Company Name - ID Verified"
  | 'structured_body'      // continuation of a structured block
  | 'date_header'
  | 'page_header'          // "1 of 2", etc.
  | 'noise';

// Patterns for classification
const ALERT_PREFIX = /^Load\s?Alert!{1,2}/i;
const ALERT_PREFIX2 = /^Alert!{1,2}/i;
const ID_VERIFIED = /ID Verified/i;
const EST_MI = /^Est\.\s+\d+\s+mi$/i;
const RATE_MI = /^\$[\d.]+\/mi$/;
const CONTACT_FOR_RATE = /^Contact for rate$/i;
const QUICK_PAY = /^Quick Pay$/i;
const STATUS_OPEN = /^Open$/i;
const STATUS_COVERED = /^Covered$/i;
const STATUS_RECENT = /^Recent$/i;
const PHONE_LINE = /^\(\d{3}\)\s*\d{3}-\d{4}/;
const DATE_LINE = /^\d{2}\/\d{2}\/\d{4}$/;
const TIME_AGO = /ago$/i;
const PAGE_HEADER = /^\d+\s+of\s+\d+$/i;
const SERVICE_LINE = /^(?:Chase|Lead|Steer|High Pole|Third Car|Route Survey)$/i;
const NYC_CERT = /^NY Certified$/i;
const LOCATION_CONCAT = /^.+,\s*[A-Z]{2},\s*USA.+,\s*[A-Z]{2},\s*USA$/;
const TOTAL_PRICE_LINE = /^\$[\d,]+(?:\.\d{2})?\s*\(total\)$/i;
const HIDDEN_COVERED = /^Hidden for Covered Loads$/i;

function classifyLine(line: RawLine, prevClass: LineClass | null): LineClass {
  const t = line.trimmed;

  // Empty — noise
  if (!t) return 'noise';

  // Page headers
  if (PAGE_HEADER.test(t)) return 'page_header';

  // Date headers
  for (const p of DATE_HEADER_PATTERNS) {
    if (p.test(t)) return 'date_header';
  }

  // Alert line
  if (ALERT_PREFIX.test(t) || ALERT_PREFIX2.test(t)) return 'alert_line';

  // Structured listing start
  if (ID_VERIFIED.test(t)) return 'structured_start';

  // Structured body lines (only valid after a structured_start or structured_body)
  if (prevClass === 'structured_start' || prevClass === 'structured_body') {
    if (STATUS_OPEN.test(t) || STATUS_COVERED.test(t) || STATUS_RECENT.test(t)) return 'structured_body';
    if (EST_MI.test(t)) return 'structured_body';
    if (RATE_MI.test(t) || TOTAL_PRICE_LINE.test(t) || CONTACT_FOR_RATE.test(t)) return 'structured_body';
    if (QUICK_PAY.test(t)) return 'structured_body';
    if (PHONE_LINE.test(t) || HIDDEN_COVERED.test(t)) return 'structured_body';
    if (DATE_LINE.test(t)) return 'structured_body';
    if (TIME_AGO.test(t) || /^less than/i.test(t)) return 'structured_body';
    if (SERVICE_LINE.test(t)) return 'structured_body';
    if (NYC_CERT.test(t)) return 'structured_body';
    if (LOCATION_CONCAT.test(t)) return 'structured_body';
    // Single location like "City, ST, USA"
    if (/^.+,\s*[A-Z]{2},\s*USA$/.test(t)) return 'structured_body';
  }

  // Noise
  return 'noise';
}

// ─── Main Segmentation ───────────────────────────────────────────

export function segmentBatch(rawText: string, suppliedDate: string | null): SegmentationResult {
  const rawLines: RawLine[] = rawText.split(/\r?\n/).map((text, i) => ({
    lineNumber: i + 1,
    text,
    trimmed: text.trim(),
  }));

  const segments: BatchSegment[] = [];
  let segIdx = 0;
  let dateContext: string | null = suppliedDate ?? null;

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const prevSegType = segments.length > 0
      ? (segments[segments.length - 1].type === 'structured_listing' ? 'structured_body' : null)
      : null;

    const cls = classifyLine(line, prevSegType as LineClass | null);

    if (cls === 'date_header') {
      const parsed = parseDateHeader(line.trimmed);
      if (parsed) dateContext = parsed;
      segments.push(makeSegment(segIdx++, 'date_context', [line], dateContext));
      i++;
      continue;
    }

    if (cls === 'page_header' || cls === 'noise') {
      // Accumulate consecutive noise lines
      const noiseLines: RawLine[] = [line];
      let j = i + 1;
      while (j < rawLines.length) {
        const nc = classifyLine(rawLines[j], 'noise');
        if (nc === 'noise' || nc === 'page_header') {
          noiseLines.push(rawLines[j]);
          j++;
        } else break;
      }
      // Only create segment if not all blank
      if (noiseLines.some(l => l.trimmed.length > 0)) {
        segments.push(makeSegment(segIdx++, 'noise', noiseLines, dateContext));
      }
      i = j;
      continue;
    }

    if (cls === 'alert_line') {
      // Each alert line is its own segment
      segments.push(makeSegment(segIdx++, 'alert_line', [line], dateContext));
      i++;
      continue;
    }

    if (cls === 'structured_start') {
      // Collect the full structured block
      const blockLines: RawLine[] = [line];
      let j = i + 1;
      while (j < rawLines.length) {
        const bc = classifyLine(rawLines[j], blockLines.length > 0 ? 'structured_body' : 'structured_start');
        if (bc === 'structured_body') {
          blockLines.push(rawLines[j]);
          j++;
        } else {
          break;
        }
      }
      segments.push(makeSegment(segIdx++, 'structured_listing', blockLines, dateContext));
      i = j;
      continue;
    }

    // Fallback — treat as noise
    segments.push(makeSegment(segIdx++, 'noise', [line], dateContext));
    i++;
  }

  const totalAlert = segments.filter(s => s.type === 'alert_line').length;
  const totalStructured = segments.filter(s => s.type === 'structured_listing').length;
  const totalNoise = segments.filter(s => s.type === 'noise').length;
  const totalDate = segments.filter(s => s.type === 'date_context').length;

  let formatMix: SegmentationResult['formatMix'] = 'unknown';
  if (totalAlert > 0 && totalStructured > 0) formatMix = 'mixed';
  else if (totalAlert > 0) formatMix = 'alert_only';
  else if (totalStructured > 0) formatMix = 'structured_only';

  return {
    segments,
    totalLinesReceived: rawLines.length,
    totalAlertSegments: totalAlert,
    totalStructuredSegments: totalStructured,
    totalNoiseSegments: totalNoise,
    totalDateSegments: totalDate,
    formatMix,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function makeSegment(
  idx: number,
  type: SegmentType,
  lines: RawLine[],
  dateContext: string | null
): BatchSegment {
  return {
    id: `segment_${String(idx).padStart(3, '0')}`,
    type,
    lines,
    rawText: lines.map(l => l.text).join('\n'),
    dateContext,
    startLine: lines[0]?.lineNumber ?? 0,
    endLine: lines[lines.length - 1]?.lineNumber ?? 0,
  };
}

function parseDateHeader(line: string): string | null {
  const trimmed = line.trim();
  // M/D/YYYY or MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    let year = parseInt(slashMatch[3]);
    if (year < 100) year += 2000;
    return `${year}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
  }
  // ISO
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;
  // Named month
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}
