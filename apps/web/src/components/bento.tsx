/**
 * Bento design-system primitives — shared between the landing page and every
 * dashboard surface. One tile = one border, one radius, one chrome. Keep
 * header/footer heights on the shared 4px grid (h-12 / min-h-14) so tiles
 * align across the grid, and always use `TileLabel` for micro-labels so
 * typography stays identical everywhere.
 */
import { cn } from "@hookbox/ui";

/** Surface + border recipe for every tile (same recipe as the landing). */
export const TILE_CLS =
  "flex min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a0e0c]";

/**
 * Micro-label: uppercase mono kicker used for section headers, tile headers
 * and form labels — the typeface that makes the bento read as one system.
 */
export function TileLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "block font-mono text-[11px] tracking-[0.14em] text-[var(--muted-fg)] uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** h-12 shared header line. Every panel header in the app uses this height. */
export function TileHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-12 shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * min-h-14 shared footer line. Metadata strips at the bottom of tiles use
 * this so baselines match across columns.
 */
export function TileFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 border-t border-[var(--border)] px-4 font-mono text-[11px] text-[var(--muted-fg)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Subtle inset separator dot for footer metadata strips. */
export function Dot() {
  return (
    <span aria-hidden className="text-[var(--border)]">
      ·
    </span>
  );
}

/**
 * Inset content card used inside a tile's scroll area (request body, raw
 * request, response preview). Same border/bg recipe, one radius down.
 */
export function InsetPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[#0a0e0c]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Header for InsetPanel — h-line + mono kicker + optional action. */
export function InsetPanelHeader({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-2">
      <TileLabel className="text-[10px] tracking-[0.15em] text-[#5a6a60]">
        {label}
      </TileLabel>
      {action}
    </div>
  );
}
