'use client';

export default function LeadGenForm({ county, state }: { county: string; state: string }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Lead captured for heavy haul in ${county}, ${state}. Broker network notified.`);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-900 border border-gray-800 rounded-xl my-8">
      <h3 className="text-xl font-bold text-white mb-2">Need an Escort in {county}?</h3>
      <p className="text-sm text-gray-400 mb-4">Submit your route dimensions and we'll instantly instantly blast it to our verified operators in {state}.</p>
      <div className="flex gap-2">
        <input type="email" placeholder="Broker Email" required className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-white" />
        <button type="submit" className="bg-yellow-500 text-black px-4 py-2 font-bold rounded hover:bg-yellow-400 transition-colors">Request Quote</button>
      </div>
    </form>
  );
}
