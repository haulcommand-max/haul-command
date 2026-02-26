
import React from 'react';
import { EscortCostRequest } from '@/lib/logic/escort_cost_estimator';

// We'll implement a simple scorer here directly using the shared logic if we ported it, 
// or implement the frontend version of ConfidenceScorer logic.
// Since we didn't export strictly the Scorer class in the shared file yet (user request 2 didn't create a shared file for Scorer, only Estimator),
// we will implement the logic here for the UI component.

const calculateScore = (req: EscortCostRequest) => {
    let score = 100;
    const suggestions: string[] = [];

    // Completeness
    if (!req.miles || req.miles <= 0) { score -= 15; suggestions.push("Add miles"); }
    const hasPos = (req.positions.leadCount > 0 || req.positions.chaseCount > 0 || req.positions.highPoleCount > 0);
    if (!hasPos) { score -= 15; suggestions.push("Add positions"); }

    // Risks
    if (req.policeRequired && (!req.policeHours || req.policeHours <= 0)) { score -= 5; suggestions.push("Police hours?"); }
    if (req.routeSurveyRequired && !req.surveyMode) { score -= 5; suggestions.push("Survey mode?"); }

    score = Math.max(15, Math.min(100, score));
    return { score, suggestions };
};

export const ConfidenceMonitor: React.FC<{ request: EscortCostRequest }> = ({ request }) => {
    const { score, suggestions } = calculateScore(request);

    let color = 'bg-red-500';
    if (score >= 85) color = 'bg-green-500';
    else if (score >= 65) color = 'bg-yellow-500';

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Confidence Score</h4>

            {/* Gauge / Bar */}
            <div className="flex items-center space-x-4 mb-4">
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-white/10">
                    <span className={`text-xl font-bold ${score >= 85 ? 'text-green-400' : score >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {score}
                    </span>
                </div>
                <div className="flex-1">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${score}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">To improve estimate accuracy:</p>
                    {suggestions.map((s, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs text-gray-300">
                            <span className="text-red-400 opacity-75">⚠</span>
                            <span>{s}</span>
                        </div>
                    ))}
                </div>
            )}

            {score === 100 && (
                <div className="text-center py-2">
                    <span className="text-green-400 text-sm font-medium">✨ Estimate Ready for Review</span>
                </div>
            )}
        </div>
    );
};
