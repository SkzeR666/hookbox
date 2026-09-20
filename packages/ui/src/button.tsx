import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-[#02120c] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[var(--accent-hover)] active:bg-[#1ea683]",
  secondary:
    "border border-[var(--border)] bg-[#111512] text-[var(--fg)] hover:border-[#33413a] hover:bg-[#161b17] active:bg-[#12160f]",
  ghost: "text-[var(--muted-fg)] hover:bg-white/5 hover:text-[var(--fg)]",
  danger:
    "border border-red-500/25 bg-red-500/10 text-red-300 hover:border-red-500/45 hover:bg-red-500/20 hover:text-red-200 active:bg-red-500/25",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-[12.5px]",
  md: "h-10 gap-2 rounded-lg px-5 text-sm",
  lg: "h-12 gap-2 rounded-lg px-8 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out select-none",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";


