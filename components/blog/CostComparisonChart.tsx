'use client';

import { useState, useEffect, useRef } from 'react';

interface CostDataItem {
  state: string;
  individualCost: number;
  reciprocityCost: number;
}

const COST_DATA: CostDataItem[] = [
  { state: 'Oregon (Base)', individualCost: 250, reciprocityCost: 250 },
  { state: 'Washington', individualCost: 350, reciprocityCost: 0 },
  { state: 'Idaho', individualCost: 200, reciprocityCost: 0 },
  { state: 'Montana', individualCost: 275, reciprocityCost: 0 },
  { state: 'Wyoming', individualCost: 225, reciprocityCost: 0 },
  { state: 'Nevada', individualCost: 300, reciprocityCost: 0 },
  { state: 'Utah', individualCost: 275, reciprocityCost: 0 },
  { state: 'Arizona', individualCost: 325, reciprocityCost: 0 },
  { state: 'California', individualCost: 495, reciprocityCost: 0 },
  { state: 'Texas', individualCost: 400, reciprocityCost: 150 },
  { state: 'Colorado', individualCost: 350, reciprocityCost: 75 },
  { state: 'New York', individualCost: 500, reciprocityCost: 500 },
  { state: 'Florida', individualCost: 375, reciprocityCost: 375 },
  { state: 'Pennsylvania', individualCost: 425, reciprocityCost: 425 },
];

export default function CostComparisonChart() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const maxCost = Math.max(...COST_DATA.map((d) => d.individualCost));

  const totalIndividual = COST_DATA.reduce((sum, d) => sum + d.individualCost, 0);
  const totalReciprocity = COST_DATA.reduce((sum, d) => sum + d.reciprocityCost, 0) + 250; // base Oregon cert
  const savings = totalIndividual - totalReciprocity;

  return (
    <div
      ref={containerRef}
      className="my-10 p-6 bg-white/[0.03] border border-white/10 rounded-2xl"
      id="cost-comparison-chart"
    >
      <h3 className="text-lg font-bold text-white mb-1">
        Certification Cost: Individual vs. Reciprocity
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Starting with an Oregon certification ($250) and leveraging reciprocity agreements can save thousands.
      </p>

      {/* Summary Boxes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-xs text-red-400 mb-1">Individual Certs</div>
          <div className="text-xl font-bold text-red-400">${totalIndividual.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <div className="text-xs text-green-400 mb-1">With Reciprocity</div>
          <div className="text-xl font-bold text-green-400">${totalReciprocity.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="text-xs text-amber-400 mb-1">You Save</div>
          <div className="text-xl font-bold text-amber-400">${savings.toLocaleString()}</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-2">
        {COST_DATA.map((item, index) => {
          const individualWidth = (item.individualCost / maxCost) * 100;
          const reciprocityWidth = (item.reciprocityCost / maxCost) * 100;
          const isFree = item.reciprocityCost === 0;
          const noSavings = item.individualCost === item.reciprocityCost;

          return (
            <div key={item.state} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 w-28 truncate">{item.state}</span>
                <span className="text-xs text-gray-600">
                  ${item.individualCost}
                  {!noSavings && (
                    <span className="text-green-500 ml-1">
                      → {isFree ? 'Free w/ reciprocity' : `$${item.reciprocityCost}`}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-5 bg-white/5 rounded-full overflow-hidden">
                {/* Individual cost bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: isVisible ? `${individualWidth}%` : '0%',
                    transitionDelay: `${index * 60}ms`,
                    background: noSavings
                      ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                      : 'linear-gradient(90deg, rgba(220,38,38,0.3), rgba(220,38,38,0.15))',
                  }}
                />
                {/* Reciprocity cost bar */}
                {!isFree && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: isVisible ? `${reciprocityWidth}%` : '0%',
                      transitionDelay: `${index * 60 + 300}ms`,
                      background: noSavings
                        ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a)',
                    }}
                  />
                )}
                {isFree && (
                  <div
                    className="absolute inset-y-0 left-0 flex items-center pl-2 transition-all duration-700"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transitionDelay: `${index * 60 + 500}ms`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                      ✓ Covered by OR cert
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-600 italic">
        Costs are approximate based on 2026 state fee schedules. Actual costs may vary.
        Data compiled from state DOT websites and ESCA bulletins.
      </p>
    </div>
  );
}
