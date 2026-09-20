import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--accent)] text-[#020b08] hover:bg-[var(--accent-hover)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-transparent text-[var(--fg)] hover:bg-[#121511]",
        variant === "ghost" &&
          "text-[var(--muted-fg)] hover:bg-[#121511] hover:text-[var(--fg)]",
        variant === "danger" &&
          "bg-[#7f1d1d] text-white hover:bg-[#991b1b]",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-9 px-4 text-sm",
        size === "lg" && "h-11 px-6 text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";


