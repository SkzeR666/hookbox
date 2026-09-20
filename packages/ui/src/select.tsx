"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn.js";

export type SelectOption = string | { value: string; label?: string };

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption>;
  id?: string;
  "aria-label"?: string;
  className?: string;
  size?: "sm" | "md";
}

const normalize = (o: SelectOption) =>
  typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value };

/**
 * Fully custom select — no native <select>. Trigger + floating listbox with
 * keyboard navigation (arrows, Home/End, Enter/Space, Escape, typeahead),
 * outside-click dismissal, and auto flip when space below is tight.
 */
export function Select({
  value,
  onChange,
  options,
  id,
  className,
  size = "md",
  ...aria
}: SelectProps) {
  const items = options.map(normalize);
  const selected = items.find((i) => i.value === value);
  const listId = useId();
  const optionId = (idx: number) => `${listId}-opt-${idx}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ chars: "", at: 0 });

  const openMenu = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 280 && rect.top > spaceBelow);
    }
    setActiveIndex(Math.max(0, items.findIndex((i) => i.value === value)));
    setOpen(true);
  };

  const closeMenu = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    const item = items[index];
    if (!item) return;
    onChange(item.value);
    closeMenu();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  // Keep the highlighted option in view while navigating.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const typeaheadMatch = (key: string) => {
    const now = Date.now();
    const t = typeahead.current;
    t.chars = now - t.at < 600 ? t.chars + key : key;
    t.at = now;
    const idx = items.findIndex((i) =>
      i.label.toLowerCase().startsWith(t.chars.toLowerCase()),
    );
    if (idx >= 0) setActiveIndex(idx);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          typeaheadMatch(e.key);
        }
    }
  };

  const triggerCls =
    size === "sm"
      ? "h-9 rounded-md text-[12.5px]"
      : "h-10 rounded-md text-[13px]";

  const itemCls = size === "sm" ? "h-9" : "h-10";

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 border border-[var(--border)] bg-[#0c0f0d] pl-3.5 pr-3 text-left font-mono text-[var(--fg)] transition-colors select-none",
          triggerCls,
          "hover:border-[#2a362f]",
          open
            ? "border-[var(--accent)]/50 ring-2 ring-[var(--accent)]/25"
            : "focus-visible:border-[var(--accent)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25",
        )}
        {...aria}
      >
        <span className="truncate">{selected?.label ?? "Select…"}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--muted-fg)] transition-transform duration-150 ease-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={aria["aria-label"] ?? "Options"}
          tabIndex={-1}
          className={cn(
            "animate-fade absolute z-30 max-h-72 w-full min-w-max overflow-y-auto rounded-lg border border-[var(--border)] bg-[#101411] p-1.5 shadow-xl shadow-black/40",
            dropUp ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {items.map((item, idx) => {
            const isSelected = item.value === value;
            return (
              <li
                key={item.value}
                id={optionId(idx)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => commit(idx)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 font-mono text-[13px] transition-colors duration-75",
                  itemCls,
                  idx === activeIndex
                    ? "bg-white/[0.07] text-[var(--fg)]"
                    : "text-[var(--muted-fg)] hover:text-[var(--fg)]",
                  isSelected && "text-[var(--accent)]",
                )}
              >
                <span className="truncate">{item.label}</span>
                {isSelected && (
                  <Check className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
