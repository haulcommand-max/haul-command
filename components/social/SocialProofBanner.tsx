'use client';

import { useEffect, useState } from 'react';

type Stats = {
  operators: number;
  countries: number;
  corridors: number;
  loads_completed: number;
};

export default function SocialProofBanner() {
  const [stats, setStats] = useState<Stats>({
    operators: 7745,
    countries: 57,
    corridors: 219,
    loads_completed: 0,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    // Fetch live stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  const items = [
    { label: 'Operators', value: stats.operators.toLocaleString(), icon: '\ud83d\udea8' },
    { label: 'Countries', value: stats.countries.toString(), icon: '\ud83c\udf0d' },
    { label: 'Corridors', value: stats.corridors + '+', icon: '\ud83d\udee3\ufe0f' },
  ];

  return (
    <div
      className={`w-full bg-gradient-to-r from-amber-500/10 to-amber-700/5 border-y border-amber-500/10 py-4 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-center gap-8 md:gap-16 px-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {item.icon} {item.value}
            </div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
