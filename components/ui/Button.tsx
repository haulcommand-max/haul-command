import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-emerald-600 text-white shadow hover:bg-emerald-600/90",
      outline: "border border-slate-700 bg-transparent shadow-sm hover:bg-slate-800 hover:text-white text-slate-300",
      ghost: "hover:bg-slate-800 hover:text-white text-slate-300",
      destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-600/90",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
    };

    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];

    return (
      <button aria-label="Interactive Button"
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
