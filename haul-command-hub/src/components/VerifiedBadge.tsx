import React from 'react';

/**
 * VerifiedBadge - A premium trust signal for Haul Command operators.
 * This is intended to be rendered on the profile pages and also 
 * used as a template for the "Embeddable Badge" backlink strategy.
 */

interface VerifiedBadgeProps {
    operatorId?: string;
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
    operatorId = "HC-VERIFIED",
    size = 'md',
    glow = true
}) => {
    const sizeClasses = {
        sm: 'w-16 h-16 text-[8px]',
        md: 'w-32 h-32 text-[10px]',
        lg: 'w-48 h-48 text-[12px]'
    };

    return (
        <div className={`relative flex flex-col items-center justify-center rounded-full bg-slate-900 border-2 border-blue-500/50 p-2 shadow-2xl ${sizeClasses[size]} ${glow ? 'shadow-blue-500/20' : ''}`}>
            {/* Animated Inner Ring */}
            <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-pulse"></div>

            {/* Badge Icon */}
            <div className="relative z-10 flex flex-col items-center text-center">
                <svg
                    className="w-1/2 h-1/2 text-blue-500 mb-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>

                <span className="font-black text-white uppercase tracking-tighter leading-none">Verified</span>
                <span className="font-bold text-blue-400 uppercase tracking-widest mt-0.5">Operator</span>

                <div className="mt-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-blue-300">
                    {operatorId}
                </div>
            </div>

            {/* Reflection Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-full"></div>
        </div>
    );
};

/**
 * Generates the embeddable HTML snippet for the Verified Badge.
 * This supports the "Badge Backlink Loop" strategy.
 */
export const getVerifiedBadgeEmbedSnippet = (operatorId: string, city: string, state: string) => {
    const slug = `${city.toLowerCase().replace(/ /g, '-')}-${state.toLowerCase()}`;
    const targetUrl = `https://haulcommand.com/services/${state.toLowerCase()}/${slug}`;
    return `<a href="${targetUrl}" rel="do-follow" title="Haul Command Verified Operator in ${city}, ${state}">
    <img src="https://haulcommand.com/api/v1/badges/verified?id=${operatorId}" alt="Verified Operator Badge" style="width: 120px; height: 120px;" />
</a>`;
};

export default VerifiedBadge;

