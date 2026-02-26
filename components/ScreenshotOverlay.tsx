import React from "react";

export type ScreenshotOverlayProps = {
    title: string;
    subtitle?: string;
    /** Optional: use a background image (e.g. a screenshot export) */
    imageSrc?: string;
    /** aspect-ratio width/height. Default ≈ iPhone portrait */
    aspectRatio?: number;
    /** Corner radius in px */
    radius?: number;
    /** Padding around overlay text in px */
    padding?: number;
    /** Place overlay at top or bottom */
    position?: "top" | "bottom";
    /** Additional className for layout systems */
    className?: string;
    /** Children render behind the overlay (Map, UI mock, etc.) */
    children?: React.ReactNode;
};

export function ScreenshotOverlay({
    title,
    subtitle,
    imageSrc,
    aspectRatio = 9 / 19.5,
    radius = 28,
    padding = 22,
    position = "top",
    className,
    children,
}: ScreenshotOverlayProps) {
    const overlayStyle: React.CSSProperties = {
        position: "absolute",
        left: padding,
        right: padding,
        top: position === "top" ? padding : undefined,
        bottom: position === "bottom" ? padding : undefined,
        pointerEvents: "none",
    };

    const cardStyle: React.CSSProperties = {
        borderRadius: 18,
        padding: 14,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.38)",
        border: "1px solid rgba(255,255,255,0.14)",
    };

    const wrapStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        borderRadius: radius,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#0b0b0b",
        aspectRatio: `${aspectRatio}`,
    };

    const bgStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
    };

    return (
        <div className={className} style={wrapStyle}>
            {imageSrc && <div style={bgStyle} />}
            {children && <div style={{ position: "absolute", inset: 0 }}>{children}</div>}

            {/* Overlay text */}
            <div style={overlayStyle}>
                <div style={cardStyle}>
                    <div style={{
                        fontSize: 26, fontWeight: 800,
                        lineHeight: 1.05, letterSpacing: -0.4,
                        color: "rgba(255,255,255,0.98)",
                    }}>
                        {title}
                    </div>
                    {subtitle && (
                        <div style={{
                            marginTop: 8, fontSize: 14, fontWeight: 600,
                            lineHeight: 1.25, color: "rgba(255,255,255,0.80)",
                        }}>
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>

            {/* Safe-area gradient for readability */}
            <div style={{
                position: "absolute", left: 0, right: 0, top: 0, height: "40%",
                background: position === "top"
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0))"
                    : "transparent",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", left: 0, right: 0, bottom: 0, height: "40%",
                background: position === "bottom"
                    ? "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))"
                    : "transparent",
                pointerEvents: "none",
            }} />
        </div>
    );
}
