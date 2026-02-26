import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ComplianceBadgeProps {
    label?: string;
    className?: string;
}

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({
    label = "Florida Certified",
    className = ""
}) => {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full ${className}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">{label}</span>
        </div>
    );
};
