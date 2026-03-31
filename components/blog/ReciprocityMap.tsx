'use client';

import { useState, useMemo } from 'react';

// State reciprocity classifications based on the blog post data
const RECIPROCITY_DATA: Record<string, { level: 'full' | 'partial' | 'none' | 'not-required'; label: string; detail: string }> = {
  OR: { level: 'full', label: 'Oregon', detail: 'Accepts any state\'s certification. ODOT cert is the industry "gold standard" — most widely accepted nationwide.' },
  WA: { level: 'full', label: 'Washington', detail: 'Accepts any state certification. Also accepts ESCA training certificates.' },
  MT: { level: 'full', label: 'Montana', detail: 'Accepts any state P/EVO certification plus valid CDL as proof of professional driving competence.' },
  ID: { level: 'full', label: 'Idaho', detail: 'Full reciprocity with all states. No separate Idaho-specific requirement.' },
  WY: { level: 'full', label: 'Wyoming', detail: 'Accepts any state certification. Equipment inspection is still required at the state line.' },
  NV: { level: 'full', label: 'Nevada', detail: 'Accepts certifications from all states. Requires proof of insurance meeting Nevada minimums ($500,000 liability).' },
  UT: { level: 'full', label: 'Utah', detail: 'Full reciprocity. Operators must still register their vehicle with UDOT for moves originating within Utah.' },
  AZ: { level: 'full', label: 'Arizona', detail: 'Accepts all state certifications. ADOT also accepts online training certificates from approved national providers.' },
  TX: { level: 'partial', label: 'Texas', detail: 'Accepts certifications from LA, OK, NM, and AR. All other states must complete the TxDMV 8-hour online refresher. Moving toward accepting all ESCA-certified operators starting July 2026.' },
  CA: { level: 'partial', label: 'California', detail: 'Only accepts Oregon, Washington, and Nevada certifications. All other operators must complete a CHP-approved 16-hour course.' },
  CO: { level: 'partial', label: 'Colorado', detail: 'Accepts certifications from bordering states (WY, NE, KS, OK, NM, UT). All other states must pass a Colorado-specific written exam.' },
  MN: { level: 'partial', label: 'Minnesota', detail: 'Accepts certifications from WI, IA, ND, SD. All other operators must complete a MnDOT safety orientation (4 hours).' },
  OH: { level: 'partial', label: 'Ohio', detail: 'Accepts certifications from IN, PA, WV, MI. All other states must apply for temporary operating authority ($150 fee, valid for 90 days).' },
  IL: { level: 'partial', label: 'Illinois', detail: 'Accepts certifications from bordering states plus Oregon and Washington. All other operators need an IDOT temporary permit.' },
  NY: { level: 'none', label: 'New York', detail: 'Requires NYSDOT-issued escort vehicle operator card. No out-of-state certifications accepted. 24-hour classroom training required.' },
  PA: { level: 'none', label: 'Pennsylvania', detail: 'Requires PennDOT-specific certification. Must attend a PA-approved training program and pass the PennDOT written exam.' },
  FL: { level: 'none', label: 'Florida', detail: 'Requires FDOT escort vehicle operator certification. 8-hour approved training + background check. No reciprocity.' },
  GA: { level: 'none', label: 'Georgia', detail: 'Requires GDOT-issued certification. State-specific 16-hour training program. No reciprocity.' },
  NC: { level: 'none', label: 'North Carolina', detail: 'NCDOT certification only. Must complete the NC-specific training through an approved provider.' },
  VA: { level: 'none', label: 'Virginia', detail: 'VDOT certification required. 8-hour state-specific training. No out-of-state certs accepted.' },
  AL: { level: 'not-required', label: 'Alabama', detail: 'No state-specific escort vehicle certification required. Insurance and equipment standards must be met.' },
  MS: { level: 'not-required', label: 'Mississippi', detail: 'No escort certification required. Must carry adequate liability insurance.' },
  SC: { level: 'not-required', label: 'South Carolina', detail: 'No state certification required. Escort operators must follow SCDOT equipment standards.' },
  SD: { level: 'not-required', label: 'South Dakota', detail: 'No certification required. Operators must comply with SD highway patrol escort guidelines.' },
  ND: { level: 'not-required', label: 'North Dakota', detail: 'No certification required. Must meet equipment standards and carry proof of insurance.' },
  NE: { level: 'not-required', label: 'Nebraska', detail: 'No state-specific certification. Equipment inspection required. Must carry $1M liability coverage.' },
  // Additional states with typical classifications
  NJ: { level: 'none', label: 'New Jersey', detail: 'NJDOT certification required. State-specific training program mandatory.' },
  CT: { level: 'none', label: 'Connecticut', detail: 'ConnDOT certification required. No reciprocity with other states.' },
  MA: { level: 'none', label: 'Massachusetts', detail: 'MassDOT certification required. 12-hour state-specific course.' },
  MD: { level: 'partial', label: 'Maryland', detail: 'Accepts certifications from VA, PA, DE, and WV. Others must complete MDOT orientation.' },
  DE: { level: 'partial', label: 'Delaware', detail: 'Accepts certifications from MD, PA, and NJ. Others need DelDOT temporary authorization.' },
  WV: { level: 'partial', label: 'West Virginia', detail: 'Accepts certifications from OH, PA, VA, KY, and MD.' },
  KY: { level: 'partial', label: 'Kentucky', detail: 'Accepts certifications from bordering states. Others need KYTC temporary permit.' },
  TN: { level: 'none', label: 'Tennessee', detail: 'TDOT certification required. State-specific training program.' },
  IN: { level: 'partial', label: 'Indiana', detail: 'Accepts certifications from OH, IL, MI, and KY.' },
  MI: { level: 'partial', label: 'Michigan', detail: 'Accepts certifications from OH, IN, WI, and MN.' },
  WI: { level: 'partial', label: 'Wisconsin', detail: 'Accepts certifications from MN, MI, IL, and IA.' },
  IA: { level: 'partial', label: 'Iowa', detail: 'Accepts certifications from bordering states.' },
  MO: { level: 'none', label: 'Missouri', detail: 'MoDOT certification required. State-specific program.' },
  AR: { level: 'partial', label: 'Arkansas', detail: 'Accepts certifications from TX, OK, LA, MS, MO, and TN.' },
  LA: { level: 'partial', label: 'Louisiana', detail: 'Accepts certifications from TX, AR, and MS.' },
  OK: { level: 'partial', label: 'Oklahoma', detail: 'Accepts certifications from TX, AR, KS, CO, and MO.' },
  KS: { level: 'partial', label: 'Kansas', detail: 'Accepts certifications from bordering states.' },
  NM: { level: 'partial', label: 'New Mexico', detail: 'Accepts certifications from TX, AZ, CO, and OK.' },
  HI: { level: 'none', label: 'Hawaii', detail: 'HDOT certification required. Unique island-specific requirements.' },
  AK: { level: 'none', label: 'Alaska', detail: 'ADOT&PF certification required. State-specific training.' },
  ME: { level: 'none', label: 'Maine', detail: 'MaineDOT certification required. No reciprocity.' },
  NH: { level: 'partial', label: 'New Hampshire', detail: 'Accepts certifications from ME, VT, and MA.' },
  VT: { level: 'partial', label: 'Vermont', detail: 'Accepts certifications from NH, MA, and NY.' },
  RI: { level: 'none', label: 'Rhode Island', detail: 'RIDOT certification required. State-specific program.' },
};

// Simplified US state paths for SVG map (simplified coordinates for each state)
// Using a simplified representation — in production you'd use a proper GeoJSON-to-SVG path
const STATE_PATHS: Record<string, string> = {
  WA: 'M125,35 L175,35 L180,65 L120,65 Z',
  OR: 'M115,65 L180,65 L175,105 L110,105 Z',
  CA: 'M100,105 L145,105 L140,200 L95,200 Z',
  NV: 'M145,90 L185,90 L180,160 L140,160 Z',
  ID: 'M180,40 L210,40 L205,110 L175,110 Z',
  MT: 'M210,30 L290,30 L285,70 L205,70 Z',
  WY: 'M205,70 L275,70 L270,110 L200,110 Z',
  UT: 'M185,100 L225,100 L220,155 L180,155 Z',
  CO: 'M225,115 L295,115 L290,155 L220,155 Z',
  AZ: 'M150,160 L200,160 L195,225 L145,225 Z',
  NM: 'M200,160 L260,160 L255,225 L195,225 Z',
  ND: 'M290,30 L355,30 L350,60 L285,60 Z',
  SD: 'M290,60 L355,60 L350,95 L285,95 Z',
  NE: 'M285,95 L365,95 L360,125 L280,125 Z',
  KS: 'M285,125 L365,125 L360,160 L280,160 Z',
  OK: 'M280,160 L365,160 L370,195 L275,195 Z',
  TX: 'M260,195 L365,195 L360,290 L255,290 Z',
  MN: 'M355,30 L405,30 L405,80 L350,80 Z',
  IA: 'M360,85 L415,85 L410,120 L355,120 Z',
  MO: 'M370,120 L425,120 L420,165 L365,165 Z',
  AR: 'M370,165 L420,165 L415,200 L365,200 Z',
  LA: 'M370,200 L415,200 L415,245 L365,245 Z',
  WI: 'M405,30 L450,30 L445,80 L400,80 Z',
  IL: 'M415,85 L445,85 L440,150 L410,150 Z',
  MI: 'M440,30 L490,30 L485,85 L435,85 Z',
  IN: 'M445,90 L475,90 L470,145 L440,145 Z',
  OH: 'M475,80 L520,80 L515,130 L470,130 Z',
  KY: 'M430,145 L510,145 L505,170 L425,170 Z',
  TN: 'M430,170 L520,170 L515,195 L425,195 Z',
  MS: 'M420,200 L455,200 L450,250 L415,250 Z',
  AL: 'M455,195 L490,195 L485,250 L450,250 Z',
  GA: 'M490,190 L535,190 L530,240 L485,240 Z',
  FL: 'M485,240 L545,240 L560,300 L495,300 Z',
  SC: 'M505,185 L555,185 L545,215 L500,215 Z',
  NC: 'M495,165 L570,165 L565,190 L490,190 Z',
  VA: 'M500,140 L570,140 L565,165 L495,165 Z',
  WV: 'M500,125 L535,125 L530,155 L495,155 Z',
  PA: 'M505,85 L570,85 L565,115 L500,115 Z',
  NY: 'M500,45 L575,45 L570,85 L495,85 Z',
  NJ: 'M565,90 L585,90 L580,120 L560,120 Z',
  CT: 'M565,70 L590,70 L587,85 L562,85 Z',
  RI: 'M585,72 L598,72 L596,82 L583,82 Z',
  MA: 'M565,60 L598,60 L596,72 L563,72 Z',
  VT: 'M555,30 L570,30 L568,60 L553,60 Z',
  NH: 'M568,25 L582,25 L580,60 L566,60 Z',
  ME: 'M575,10 L610,10 L605,50 L573,50 Z',
  MD: 'M530,115 L575,115 L572,135 L527,135 Z',
  DE: 'M570,105 L585,105 L583,125 L568,125 Z',
  AK: 'M35,260 L110,260 L105,310 L30,310 Z',
  HI: 'M170,280 L220,280 L215,305 L165,305 Z',
};

const LEVEL_COLORS = {
  'full': { bg: '#166534', border: '#22c55e', label: 'Full Reciprocity', labelBg: '#166534' },
  'partial': { bg: '#92400e', border: '#f59e0b', label: 'Partial Reciprocity', labelBg: '#92400e' },
  'none': { bg: '#991b1b', border: '#ef4444', label: 'No Reciprocity', labelBg: '#991b1b' },
  'not-required': { bg: '#1e293b', border: '#64748b', label: 'No Cert Required', labelBg: '#1e293b' },
};

export default function ReciprocityMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { full: 0, partial: 0, none: 0, 'not-required': 0 };
    Object.values(RECIPROCITY_DATA).forEach((d) => c[d.level]++);
    return c;
  }, []);

  const activeState = selectedState || hoveredState;
  const activeData = activeState ? RECIPROCITY_DATA[activeState] : null;

  return (
    <div className="my-10 p-6 bg-white/[0.03] border border-white/10 rounded-2xl" id="reciprocity-map">
      <h3 className="text-lg font-bold text-white mb-1">
        Interactive Reciprocity Map
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Hover or tap a state to see its escort certification reciprocity status.
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(LEVEL_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: val.bg, borderColor: val.border }}
            />
            <span className="text-xs text-gray-400">
              {val.label} ({counts[key as keyof typeof counts]})
            </span>
          </div>
        ))}
      </div>

      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox="0 0 640 320"
          className="w-full h-auto"
          role="img"
          aria-label="United States map showing escort certification reciprocity levels by state. Green states offer full reciprocity, amber states offer partial reciprocity, red states require state-specific certification, and gray states have no certification requirement."
        >
          <rect width="640" height="320" fill="transparent" />
          {Object.entries(STATE_PATHS).map(([code, path]) => {
            const data = RECIPROCITY_DATA[code];
            if (!data) return null;
            const colors = LEVEL_COLORS[data.level];
            const isActive = activeState === code;

            return (
              <g key={code}>
                <path
                  d={path}
                  fill={isActive ? colors.border + '40' : colors.bg}
                  stroke={isActive ? colors.border : colors.border + '60'}
                  strokeWidth={isActive ? 2 : 1}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredState(code)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => setSelectedState(selectedState === code ? null : code)}
                />
                <text
                  x={getCenter(path).x}
                  y={getCenter(path).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive ? '#ffffff' : '#ffffff90'}
                  fontSize="9"
                  fontWeight={isActive ? 700 : 500}
                  className="pointer-events-none select-none"
                  fontFamily="Inter, sans-serif"
                >
                  {code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* State Detail Panel */}
      {activeData && (
        <div
          className="mt-4 p-4 rounded-xl border transition-all duration-200"
          style={{
            backgroundColor: LEVEL_COLORS[activeData.level].bg + '30',
            borderColor: LEVEL_COLORS[activeData.level].border + '40',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider"
              style={{
                backgroundColor: LEVEL_COLORS[activeData.level].border + '20',
                color: LEVEL_COLORS[activeData.level].border,
              }}
            >
              {LEVEL_COLORS[activeData.level].label}
            </span>
            <h4 className="text-white font-bold">{activeData.label}</h4>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{activeData.detail}</p>
        </div>
      )}
    </div>
  );
}

// Helper to find approximate center of a simplified path
function getCenter(path: string): { x: number; y: number } {
  const nums = path.match(/[\d.]+/g)?.map(Number) || [];
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < nums.length; i += 2) {
    sumX += nums[i];
    sumY += nums[i + 1];
    count++;
  }
  return { x: sumX / count, y: sumY / count };
}
