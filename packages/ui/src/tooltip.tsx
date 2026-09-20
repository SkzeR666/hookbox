"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "./cn.js";

export interface TooltipProps {
  /** Tooltip text. */
  label: string;
  children: React.ReactNode;
  /** Where the tooltip appears relative to the target. @default top */
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Fully custom tooltip — no native `title` attribute. Shows on hover and
 * keyboard focus with a short delay; flips vertically when space is tight.
 */
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  // Tooltip text renders client-side only: labels can embed locale/timezone-
  // formatted values that differ between server and browser (hydration mismatch).
  // Hover requires JS anyway, so nothing is lost for SSR users.
  const [mounted, setMounted] = useState(false);
  const [flip, setFlip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setMounted(true), []);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const rect = (
        rootRef.current as HTMLElement | null
      )?.getBoundingClientRect();
      if (rect) {
        const spaceAbove = rect.top;
        setFlip(side === "top" ? spaceAbove < 44 : window.innerHeight - rect.bottom < 44 && spaceAbove > 44);
      }
      setVisible(true);
    }, 350);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      onPointerDown={hide}
    >
      {children}
      {mounted && (
        <span
          role="tooltip"
          id={id}
          aria-hidden={!visible}
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[#101411] px-2 py-1 font-mono text-[11px] leading-none text-[var(--fg)] shadow-lg shadow-black/40 transition-[opacity,transform] duration-150 ease-out",
            flip
              ? "top-full mt-1.5"
              : "bottom-full mb-1.5",
            visible
              ? "opacity-100 translate-y-0"
              : cn("opacity-0", flip ? "translate-y-0.5" : "-translate-y-0.5"),
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
