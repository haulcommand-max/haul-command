import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "default" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    // Highly premium button base with modern web aesthetics (rounded-xl minimum)
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 tracking-wide";
    
    const variants = {
      primary: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.23)] hover:scale-[1.02] border border-yellow-400/50",
      secondary: "bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-[0_4px_14px_0_rgba(255,255,255,0.05)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]",
      outline: "border-2 border-slate-700 bg-transparent text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/50",
      ghost: "text-slate-300 hover:text-white hover:bg-white/10",
      destructive: "bg-red-600/90 text-white shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:bg-red-500 hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:scale-[1.02]",
    };

    const sizes = {
      default: "h-12 px-6 rounded-xl text-[15px]",
      sm: "h-10 rounded-lg px-4 text-sm",
      lg: "h-14 rounded-2xl px-10 text-base",
    };

    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];

    return (
      <button 
        aria-label="Interactive Button"
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
