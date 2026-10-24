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
          "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 disabled:pointer-events-none disabled:opacity-50 rounded min-h-[44px] px-6 text-sm active:scale-[0.98] cursor-pointer",
          variant === "default" && "bg-secondary text-on-secondary hover:bg-secondary/90 shadow-sm",
          variant === "outline" && "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low shadow-xs",
          variant === "secondary" && "bg-surface-container text-on-surface hover:bg-surface-container-high",
          variant === "ghost" && "hover:bg-surface-container text-on-surface",
          variant === "danger" && "bg-error text-on-error hover:bg-error/90",
          size === "sm" && "min-h-[36px] px-3.5 text-xs",
          size === "lg" && "min-h-[50px] px-8 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
