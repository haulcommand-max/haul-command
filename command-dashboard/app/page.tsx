
import EscortCalculator from "@/components/EscortCalculator";

export default function Home() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Navbar Placeholder */}
            <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">H</div>
                    <span className="font-bold tracking-tight">HAUL COMMAND</span>
                </div>
                <div className="flex space-x-4 text-sm text-gray-400">
                    <span className="hover:text-white cursor-pointer">Dashboard</span>
                    <span className="text-white font-medium cursor-pointer">Calculator</span>
                    <span className="hover:text-white cursor-pointer">Directory</span>
                </div>
            </nav>

            {/* Hero / Header */}
            <header className="py-12 text-center px-4">
                <h1 className="text-3xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                    VEHICLE CONFIGURATOR
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Generate instant, range-based cost estimates for civilian escorts, high poles, and police support.
                    Compliance-first, strictly non-binding.
                </p>
            </header>

            {/* Main App */}
            <EscortCalculator />

            {/* Footer */}
            <footer className="text-center text-gray-600 text-xs py-12">
                &copy; 2026 Haul Command. HCFY 2026. All estimates provided as-is.
            </footer>
        </main>
    );
}
