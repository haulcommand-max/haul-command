'use client';

// Task 21: <GlobalReciprocityMap />
// Simple stub representing an interactive SVG/Choropleth map.

export default function GlobalReciprocityMap({ originState }: { originState: string }) {
  // In a real app this uses something like Recharts, D3, or simple SVGs.
  
  return (
    <div className="bg-hc-gray-900 border border-hc-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-blue-500">ðŸŒ</span> Reciprocity Zone Mapper
      </h3>
      <div className="bg-gray-800 rounded-lg p-12 text-center relative border border-dashed border-hc-gray-600">
        <p className="text-gray-400 mb-2 font-mono">
          [Interactive SVG Map Rendered Here]
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span> Full Acceptance
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-hc-yellow-400 rounded-full"></span> Add-on Required
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-red-600 rounded-full"></span> Not Valid
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-hc-gray-800 rounded">
        <p className="text-sm font-bold text-white mb-1">Origin License: {originState}</p>
        <p className="text-xs text-hc-gray-400">Analysis run via the Haul Command Reciprocity graph.</p>
      </div>
    </div>
  );
}