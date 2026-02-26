
import React from "react";

interface LoadCardRateBlockProps {
    rate: number;
    miles: number;
    fillProbability: number;
    difficulty: "Low" | "Medium" | "High" | "Extreme";
}

const LoadCardRateBlock: React.FC<LoadCardRateBlockProps> = ({
    rate,
    miles,
    fillProbability,
    difficulty,
}) => {
    const rpm = rate / miles;
    const probColor = fillProbability > 80 ? "text-green-500" : fillProbability > 50 ? "text-accent" : "text-red-500";

    const diffConfigs = {
        Low: { color: "bg-green-500/10 text-green-500", label: "Clean Run" },
        Medium: { color: "bg-yellow-500/10 text-yellow-500", label: "Standard" },
        High: { color: "bg-orange-500/10 text-orange-500", label: "Technical" },
        Extreme: { color: "bg-red-500/10 text-red-500", label: "Superload" },
    };

    const config = diffConfigs[difficulty] || diffConfigs.Medium;

    return (
        <div className="flex items-center gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Total Pay</span>
                <span className="text-2xl font-black text-white tracking-tighter">${rate.toLocaleString()}</span>
                <span className="text-[10px] text-accent font-bold italic">${rpm.toFixed(2)} / mi</span>
            </div>

            <div className="h-10 w-px bg-white/10"></div>

            <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Efficiency</span>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${probColor}`}>{Math.round(fillProbability)}%</span>
                    <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${fillProbability > 80 ? 'bg-green-500' : fillProbability > 50 ? 'bg-accent' : 'bg-red-500'}`}
                            style={{ width: `${fillProbability}%` }}
                        ></div>
                    </div>
                </div>
                <span className="text-[10px] text-gray-600 font-bold uppercase">Confidence</span>
            </div>

            <div className="ml-auto">
                <div className={`px-3 py-1 rounded-full border border-white/5 ${config.color} text-[10px] font-black uppercase tracking-widest italic`}>
                    {config.label}
                </div>
            </div>
        </div>
    );
};

export default LoadCardRateBlock;
