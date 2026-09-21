"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "./cn.js";

export interface TooltipProps {
  /** Tooltip text. */
  label: string;
  children: React.ReactNode;
  /** Preferred side. Auto-flips when the viewport edge is near. @default top */
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Fully custom tooltip — no native `title` attribute. Positioned with
 * `position: fixed` so it escapes every ancestor overflow (dialogs, panels)
 * and never gets clipped by the frame. Shows on hover and keyboard focus.
 */
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null);
  // Tooltip text renders client-side only: labels can embed locale/timezone-
  // formatted values that differ between server and browser (hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setMounted(true), []);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + rect.width / 2;
        const left = Math.min(Math.max(centerX, 100), window.innerWidth - 100);
        const below = side === "bottom" || (side === "top" && rect.top < 48);
        setPos({
          below,
          left,
          top: below ? rect.bottom + 7 : rect.top - 7,
        });
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
      {mounted && pos && (
        <span
          role="tooltip"
          id={id}
          aria-hidden={!visible}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: pos.below
              ? "translate(-50%, 0)"
              : "translate(-50%, -100%)",
          }}
          className={cn(
            "pointer-events-none z-[100] whitespace-nowrap rounded-md border border-[var(--border)] bg-[#101411] px-2 py-1 font-mono text-[11px] leading-none text-[var(--fg)] shadow-lg shadow-black/40 transition-opacity duration-150 ease-out",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
