import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="text-accent text-xl font-black tracking-tighter">
                            HAUL COMMAND<span className="text-white"> HUB</span>
                        </Link>
                    </div>
                    <div className="hidden md:ml-6 md:flex md:space-x-8">
                        <Link href="/blog" className="text-gray-300 hover:text-accent px-3 py-2 text-sm font-medium">
                            Intelligence
                        </Link>
                        <Link href="/tools/friday-checker" className="text-gray-300 hover:text-accent px-3 py-2 text-sm font-medium">
                            Friday Checker
                        </Link>
                        <Link href="/tools/superload-meter" className="text-gray-300 hover:text-accent px-3 py-2 text-sm font-medium">
                            Superload Meter
                        </Link>
                    </div>
                    <div className="flex items-center">
                        <button className="bg-accent text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-yellow-500 transition-colors">
                            Access Network
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
