import type { HTMLAttributes } from "react";
import { cn } from "./cn.js";

export type BadgeTone =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "gray"
  | "purple";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export const Badge = ({
  className,
  tone = "gray",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none",
      tone === "green" && "bg-emerald-500/15 text-emerald-300",
      tone === "red" && "bg-red-500/15 text-red-300",
      tone === "yellow" && "bg-yellow-500/15 text-yellow-300",
      tone === "blue" && "bg-sky-500/15 text-sky-300",
      tone === "gray" && "bg-white/5 text-[#9aa49d]",
      tone === "purple" && "bg-purple-500/15 text-purple-300",
      className,
    )}
    {...props}
  />
);


