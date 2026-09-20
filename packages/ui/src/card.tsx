import type { HTMLAttributes } from "react";
import { cn } from "./cn.js";

export const Card = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-lg border border-[var(--border)] bg-[var(--bg-2)] shadow-sm",
      className,
    )}
    {...props}
  />
);

export const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-center justify-between gap-3", className)}
    {...props}
  />
);


