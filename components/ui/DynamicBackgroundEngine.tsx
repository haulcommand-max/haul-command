"use client";

import { usePathname } from 'next/navigation';
import Image from 'next/image';

const EUROPE = ['gb','ie','de','nl','se','no','dk','fi','be','at','ch','es','fr','it','pt','pl','cz','sk','hu','si','ee','lv','lt','hr','ro','bg','gr','rs','ua','cy','is','lu','ba','me','mk','al','md','mt','tr','europe'];
const MIDDLE_EAST = ['ae','sa','qa','kw','om','bh','il','jo','iq','middle-east','uae'];
const LATIN_AMERICA = ['br','mx','ar','co','pe','cl','uy','pa','cr','ec','bo','py','gt','do','hn','sv','ni','jm','gy','sr','latin-america','south-america'];
const ASIA = ['in','id','th','jp','kr','vn','ph','sg','my','tw','pk','bd','mn','kh','lk','uz','la','np','bn','tm','kg','asia'];
const AFRICA = ['za','ng','eg','ke','ma','tz','gh','ge','az','dz','tn','na','ao','mz','et','ci','sn','bw','zm','ug','cm','rw','mg','mw','pg','africa'];
const OCEANIA = ['au','nz','australia','new-zealand'];

export function DynamicBackgroundEngine() {
    const pathname = usePathname();
    const pathLower = pathname.toLowerCase();
    
    let bgImage = '/backgrounds/homepage-hero.jpg';

    // Route Parsing Logic (Competitor & Tools)
    if (pathLower.startsWith('/vs')) bgImage = '/backgrounds/vs-hero.jpg';
    else if (pathLower.includes('wind-energy')) bgImage = '/backgrounds/wind-energy-hero.jpg';
    else if (pathLower.includes('autonomous')) bgImage = '/backgrounds/autonomous-hero.jpg';
    else if (pathLower.includes('tools/dot') || pathLower.includes('route-check')) bgImage = '/backgrounds/dot-hero.jpg';
    
    // Geographical routing fallback mapping (US smart sensing for mountains vs desert)
    else if (pathLower.match(/\/(wyoming|colorado|montana|ak|alaska)\b/)) bgImage = '/backgrounds/mountain-hero.jpg';
    else if (pathLower.match(/\/(texas|arizona|nevada|tx|az)\b/)) bgImage = '/backgrounds/desert-hero.jpg';
    
    // Global 120-Country Visual Routing (Exact match for the 5 Fortune Tiers)
    else if (OCEANIA.some(code => pathLower.match(new RegExp(`\\/${code}\\b`)))) bgImage = '/backgrounds/australia-hero.jpg';
    else if (EUROPE.some(code => pathLower.match(new RegExp(`\\/${code}\\b`)))) bgImage = '/backgrounds/europe-hero.jpg';
    else if (MIDDLE_EAST.some(code => pathLower.match(new RegExp(`\\/${code}\\b`)))) bgImage = '/backgrounds/middle-east-hero.jpg';
    else if (LATIN_AMERICA.some(code => pathLower.match(new RegExp(`\\/${code}\\b`)))) bgImage = '/backgrounds/latin-america-hero.jpg';
    else if (ASIA.some(code => pathLower.match(new RegExp(`\\/${code}\\b`)))) bgImage = '/backgrounds/asia-hero.jpg';
    else if (AFRICA.some(code => pathLower.match(new RegExp(`\\/${code}\\b`)))) bgImage = '/backgrounds/africa-hero.jpg';

    // Core Functional Fallbacks
    else if (pathLower.startsWith('/trust') || pathLower.startsWith('/verify') || pathLower.startsWith('/security')) bgImage = '/backgrounds/verify-hero.jpg';
    else if (pathLower.includes('carrier') || pathLower.includes('operator')) bgImage = '/backgrounds/carrier-hero.jpg';
    else if (pathLower.includes('finance') || pathLower.includes('invoicing')) bgImage = '/backgrounds/finance-hero.jpg';
    else if (pathLower.startsWith('/store') || pathLower.startsWith('/marketplace')) bgImage = '/backgrounds/store-hero.jpg';
    
    // Core 15 Family Fallbacks (Lowest Priority so hyper-local overrides them)
    else if (pathLower.startsWith('/training')) bgImage = '/backgrounds/training-hero.jpg';
    else if (pathLower.startsWith('/directory')) bgImage = '/backgrounds/directory-hero.jpg';
    else if (pathLower.startsWith('/corridor')) bgImage = '/backgrounds/corridor-hero.jpg';
    else if (pathLower.startsWith('/load-board') || pathLower.startsWith('/loads')) bgImage = '/backgrounds/load-board-hero.jpg';
    else if (pathLower.startsWith('/profiles') || pathLower.startsWith('/vendors')) bgImage = '/backgrounds/profiles-hero.jpg';
    else if (pathLower.startsWith('/regulations')) bgImage = '/backgrounds/regulations-hero.jpg';
    else if (pathLower.startsWith('/glossary')) bgImage = '/backgrounds/glossary-hero.jpg';
    else if (pathLower.startsWith('/blog')) bgImage = '/backgrounds/blog-hero.jpg';
    else if (pathLower.startsWith('/forms')) bgImage = '/backgrounds/forms-hero.jpg';
    else if (pathLower.startsWith('/tools')) bgImage = '/backgrounds/tools-hero.jpg';
    else if (pathLower.startsWith('/about')) bgImage = '/backgrounds/about-hero.jpg';
    else if (pathLower.startsWith('/contact')) bgImage = '/backgrounds/contact-hero.jpg';
    else if (pathLower.startsWith('/dashboard') || pathLower.startsWith('/admin')) bgImage = '/backgrounds/dashboard-hero.jpg';

    return (
        <div className="fixed inset-0 -z-50 pointer-events-none bg-hc-bg bg-industrial-noise">
            <div className="absolute inset-0 bg-grid-white/5 pointer-events-none z-0" />
            <Image
                src={bgImage}
                alt="Haul Command Global Operations"
                fill
                quality={100}
                className="object-cover opacity-[0.12] mix-blend-screen transition-opacity duration-1000"
                priority
            />
            {/* Deep fade gradient overlay to ensure text contrast at the bottom of pages */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-transparent to-[#07090D]/50" />
            <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-[#07090D] to-transparent" />
        </div>
    );
}
