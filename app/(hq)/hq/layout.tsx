import { ReactNode } from "react";
import Link from "next/link";
import { Command, BarChart, Shield, Navigation2, Database, DollarSign, Activity } from "lucide-react";

export const metadata = {
  title: "Haul Command | HQ Dashboard",
  description: "Internal Command-OS Control Plane",
};

export default function HQLayout({ children }: { children: ReactNode }) {
  const sidebarNav = [
    { name: "HQ", path: "/hq", icon: Command },
    { name: "Markets", path: "/hq/markets", icon: Navigation2 },
    { name: "Entities", path: "/hq/entities", icon: Database },
    { name: "Agents & Swarms", path: "/hq/agents", icon: Activity },
    { name: "Monetization", path: "/hq/money", icon: DollarSign },
    { name: "SEO & Surfaces", path: "/hq/seo", icon: BarChart },
    { name: "Trust & Proof", path: "/hq/proof", icon: Shield },
  ];

  return (
    <div className="flex h-screen  text-slate-100 overflow-hidden">
      {/* Sidebar Command Navbar */}
      <aside className="w-64 border-r border-slate-800  flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <Link href="/hq" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/50 flex items-center justify-center">
              <Command className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-tight">HAUL COMMAND</h1>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Board Operations</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarNav.map((nav) => (
            <Link 
              key={nav.path} 
              href={nav.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
            >
              <nav.icon className="h-4 w-4" />
              {nav.name}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-md  border border-slate-800">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs font-mono text-slate-400">
              <span className="text-emerald-500">SYSTEM:</span> NOMINAL<br />
              <span className="text-slate-500">113 AGENTS ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden  flex flex-col">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-8 z-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
}