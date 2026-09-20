import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn.js";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-[var(--border)] bg-[#0c0f0d] px-3 text-sm text-[var(--fg)] transition-colors",
      "placeholder:text-[#5b645e]",
      "hover:border-[#2a362f]",
      "focus-visible:border-[var(--accent)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";


