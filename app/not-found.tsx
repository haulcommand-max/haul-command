import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-white p-10">
      <div className="text-center space-y-6 max-w-xl">
        <h1 className="text-6xl font-black text-gray-800 uppercase tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Zone Restricted</h2>
        <p className="text-gray-400 font-mono text-sm leading-relaxed">
          The requested coordinate lies completely outside established mapping bounds. The trajectory cannot be rendered.
        </p>
        <Link href="/" className="inline-block border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white px-8 py-4 font-bold uppercase tracking-widest text-sm transition-all mt-4">
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
}
