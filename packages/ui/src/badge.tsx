import type { HTMLAttributes } from "react";
import { cn } from "./cn.js";

export type BadgeTone =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "gray"
  | "purple"
  | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, string> = {
  green: "bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20",
  red: "bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-400/20",
  yellow: "bg-yellow-500/12 text-yellow-300 ring-1 ring-inset ring-yellow-400/20",
  blue: "bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/20",
  gray: "bg-white/5 text-[#9aa49d] ring-1 ring-inset ring-white/10",
  purple: "bg-purple-500/12 text-purple-300 ring-1 ring-inset ring-purple-400/20",
  outline: "bg-transparent text-[var(--muted-fg)] ring-1 ring-inset ring-[var(--border)]",
};

export const Badge = ({
  className,
  tone = "gray",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none",
      TONES[tone],
      className,
    )}
    {...props}
  />
);


