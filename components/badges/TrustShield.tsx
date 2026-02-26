import { clsx } from "clsx";

interface TrustShieldProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function TrustShield({ score, size = 'md', className }: TrustShieldProps) {
    // Color Logic
    let colorClass = "text-red-500 border-red-200 bg-red-50";
    if (score >= 90) {
        colorClass = "text-green-600 border-green-200 bg-green-50";
    } else if (score >= 70) {
        colorClass = "text-yellow-600 border-yellow-200 bg-yellow-50";
    }

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs border-2',
        md: 'w-12 h-12 text-base border-4',
        lg: 'w-16 h-16 text-xl border-4'
    };

    const ringRadius = 18;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const strokeDashoffset = ringCircumference - (score / 100) * ringCircumference;

    return (
        <div className={clsx("relative flex items-center justify-center rounded-full font-bold", colorClass, sizeClasses[size], className)}>
            {/* SVG Ring for visual flair */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 40 40">
                <circle
                    className="text-gray-200"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r={ringRadius}
                    cx="20"
                    cy="20"
                />
                <circle
                    className={score >= 90 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-red-500"}
                    strokeWidth="3"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={ringRadius}
                    cx="20"
                    cy="20"
                />
            </svg>
            <span className="relative z-10">{score}</span>
        </div>
    );
}
