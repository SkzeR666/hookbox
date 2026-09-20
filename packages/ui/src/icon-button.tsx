import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn.js";
import { Tooltip } from "./tooltip.js";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "secondary";
  size?: "sm" | "md";
  /** Accessible label — also shown as the custom tooltip */
  label: string;
}

const SIZES = {
  sm: "h-8 w-8 rounded-md [&_svg]:size-4",
  md: "h-9 w-9 rounded-md [&_svg]:size-4",
} as const;

const VARIANTS = {
  ghost:
    "text-[var(--muted-fg)] hover:bg-white/5 hover:text-[var(--fg)] active:scale-[0.94]",
  secondary:
    "border border-[var(--border)] bg-[#111512] text-[var(--fg)] hover:border-[#33413a] hover:bg-[#161b17] active:scale-[0.94]",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", label, ...props }, ref) => (
    <Tooltip label={label}>
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center",
          "transition-[background-color,color,transform] duration-150 ease-out select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
          "disabled:pointer-events-none disabled:opacity-50",
          SIZES[size],
          VARIANTS[variant],
          className,
        )}
        {...props}
      />
    </Tooltip>
  ),
);
IconButton.displayName = "IconButton";
