import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 rounded-xl min-h-[48px] px-6 text-base active:scale-[0.98]",
          variant === "default" && "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
          variant === "outline" && "border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
          variant === "secondary" && "bg-slate-100 text-slate-900 hover:bg-slate-200",
          variant === "ghost" && "hover:bg-slate-100 text-slate-700",
          variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
          size === "sm" && "min-h-[40px] px-4 text-sm",
          size === "lg" && "min-h-[56px] px-8 text-lg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
