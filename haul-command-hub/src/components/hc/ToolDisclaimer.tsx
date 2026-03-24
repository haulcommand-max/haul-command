/**
 * ToolDisclaimer — Legal cover layer for all 30 calculators.
 *
 * Legal strategy: "Informational Tool" classification (same as Google Maps).
 * Every calculator must show this. No exceptions.
 *
 * Usage: Place at top AND bottom of every tool result page.
 */

interface ToolDisclaimerProps {
  /** Official source this tool's data is based on */
  dataSource?: string;
  /** Specific authority URL for the regulation */
  authorityUrl?: string;
  /** Jurisdiction this applies to */
  jurisdiction?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

export default function ToolDisclaimer({
  dataSource = 'FHWA regulations and state DOT guidelines',
  authorityUrl,
  jurisdiction,
  compact = false,
}: ToolDisclaimerProps) {
  if (compact) {
    return (
      <p className="text-[10px] text-gray-600 leading-relaxed mt-2">
        ⚠️ Estimates only. Always verify with{' '}
        {authorityUrl ? (
          <a href={authorityUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">
            {jurisdiction ?? 'the relevant authority'}
          </a>
        ) : (
          <span>{jurisdiction ?? 'the relevant authority'}</span>
        )}{' '}
        before any move. Haul Command assumes no liability.
      </p>
    );
  }

  return (
    <div className="mt-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
      <div className="flex items-start gap-2">
        <span className="text-yellow-500 text-sm flex-shrink-0 mt-0.5">⚠️</span>
        <div className="space-y-1.5">
          <p className="font-bold text-yellow-400/80">Regulatory Disclaimer</p>
          <p>
            This tool provides estimates for informational purposes only. Regulations change
            frequently. Always verify requirements with the relevant state, federal, or national
            authority before any move. Haul Command assumes no liability for decisions made based
            on these results.
          </p>
          {dataSource && (
            <p>
              <span className="text-gray-500">Based on: </span>
              {authorityUrl ? (
                <a
                  href={authorityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {dataSource}
                </a>
              ) : (
                <span>{dataSource}</span>
              )}
              {jurisdiction && <span className="text-gray-500"> · {jurisdiction}</span>}
            </p>
          )}
          <p className="text-gray-600">
            Requirements change. Check with local authorities for the most current information.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Disclaimer configs for each tool ─────────────────────────────────────

export const TOOL_DISCLAIMERS = {
  escortCalculator: {
    dataSource: 'FHWA Oversize/Overweight regulations + state DOT rules',
    authorityUrl: 'https://ops.fhwa.dot.gov/freight/sw/index.htm',
    jurisdiction: 'United States',
  },
  permitCost: {
    dataSource: 'State permit fee schedules and FHWA guidelines',
    authorityUrl: 'https://ops.fhwa.dot.gov/freight/sw/index.htm',
    jurisdiction: 'United States',
  },
  bridgeFormula: {
    dataSource: 'Federal Bridge Formula (23 USC 127)',
    authorityUrl: 'https://www.law.cornell.edu/uscode/text/23/127',
    jurisdiction: 'United States Federal',
  },
  axleWeight: {
    dataSource: 'State axle weight tables + FHWA bridge formula',
    authorityUrl: 'https://ops.fhwa.dot.gov/freight/sw/index.htm',
    jurisdiction: 'United States',
  },
  curfew: {
    dataSource: 'State DOT travel restriction schedules',
    jurisdiction: 'State-specific',
  },
  international: {
    dataSource: 'Country-specific road authority regulations',
    jurisdiction: 'International — verify with local authority',
  },
  superload: {
    dataSource: 'State superload permit thresholds + FHWA guidelines',
    authorityUrl: 'https://ops.fhwa.dot.gov/freight/sw/index.htm',
    jurisdiction: 'United States',
  },
  costEstimator: {
    dataSource: 'Market rate data and fuel cost indices',
    jurisdiction: 'Estimates only — market rates vary',
  },
};
