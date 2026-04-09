import Link from 'next/link';
import { Search, ArrowRight, UserX } from 'lucide-react';

export default function ProfileNotFound() {
    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(226,54,54,0.06),transparent)]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl mx-auto py-20 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                        <UserX className="w-10 h-10 text-red-500 opacity-80" />
                    </div>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-white">
                    Operator Not Found
                </h1>
                
                <p className="text-lg text-[#8fa3b8] mb-8 max-w-md mx-auto">
                    The escort operator profile you&apos;re looking for couldn&apos;t be found. The link might be broken, or the operator may have been removed from the directory.
                </p>

                {/* Search options */ }
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    <Link href="/directory" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1A1D21] hover:bg-[#23272C] text-white font-bold text-sm rounded-xl transition-all shadow-sm border border-white/5">
                        <Search className="w-4 h-4 text-[#8fa3b8]" />
                        Search Directory
                    </Link>
                    <Link href="/home" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#F1A91B] hover:bg-[#E0A318] text-white font-bold text-sm rounded-xl transition-all press-scale shadow-[0_0_20px_rgba(241,169,27,0.15)]">
                        Go to Command Center
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
