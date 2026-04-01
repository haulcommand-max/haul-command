'use client';

import { useEffect, useState } from 'react';
// import Confetti from 'react-confetti'; // Assuming installed

export default function ConfettiWrapper({ runConfetti }: { runConfetti: boolean }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (!runConfetti) return null;

  // Placeholder for the actual react-confetti canvas to avoid uninstalled dependency build crashes
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
      <div className="bg-yellow-500 text-black px-6 py-3 rounded-full font-black animate-bounce shadow-2xl">
        🎉 MILESTONE REACHED! 🎉
      </div>
      {/* <Confetti width={dimensions.width} height={dimensions.height} recycle={false} numberOfPieces={500} /> */}
    </div>
  );
}
