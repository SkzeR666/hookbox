import { cn } from "./cn.js";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-[var(--border)] bg-[#111512] px-1.5 font-mono text-[10.5px] font-medium text-[var(--muted-fg)]",
        className,
      )}
      {...props}
    />
  );
}
