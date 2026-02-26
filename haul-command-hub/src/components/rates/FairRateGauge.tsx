
import React from "react";

interface FairRateGaugeProps {
    currentRate: number;
    benchmarkRate: number;
    confidence: number;
}

const FairRateGauge: React.FC<FairRateGaugeProps> = ({
    currentRate,
    benchmarkRate,
    confidence,
}) => {
    const diff = ((currentRate - benchmarkRate) / benchmarkRate) * 100;
    const isHigh = diff > 15;
    const isFair = diff >= -10 && diff <= 15;
    const isLow = diff < -10;

    let color = "bg-gray-500";
    let label = "Checking Market...";

    if (isHigh) {
        color = "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
        label = "Pricey (Negotiate)";
    } else if (isFair) {
        color = "bg-accent shadow-[0_0_15px_rgba(245,158,11,0.5)]";
        label = "Fair Market (Ready)";
    } else if (isLow) {
        color = "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
        label = "Aggressive (Jump)";
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <span>Market Position</span>
                <span>{confidence}% Depth</span>
            </div>
            <div className="relative h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${Math.min(100, Math.max(10, (currentRate / (benchmarkRate * 1.5)) * 100))}%` }}
                ></div>
                <div
                    className="absolute top-0 bottom-0 w-px bg-white/40"
                    style={{ left: "66%" }} // Benchmark line
                ></div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase italic ${isHigh ? 'text-red-500' : isFair ? 'text-accent' : 'text-green-500'}`}>
                    {label}
                </span>
                <span className="text-[10px] text-gray-500">vs ${benchmarkRate.toFixed(2)}/mi</span>
            </div>
        </div>
    );
};

export default FairRateGauge;
