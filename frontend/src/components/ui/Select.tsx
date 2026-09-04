"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  // shows a check on the row, e.g. a tone already generated for this article
  done?: boolean;
}

export default function Select<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SelectOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value)),
  );
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setActive(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(options[active].value);
      setOpen(false);
    } else if (e.key.length === 1) {
      const i = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(e.key.toLowerCase()),
      );
      if (i >= 0) setActive(i);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-line bg-surface pl-2.5 pr-2 text-[13px] text-ink transition-colors hover:border-line-strong"
      >
        <span className="capitalize">{current?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute bottom-full z-20 mb-1.5 min-w-[190px] overflow-hidden rounded-[var(--radius)] border border-line bg-surface py-1 shadow-[var(--shadow-lift)]"
        >
          {options.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] capitalize ${
                  i === active ? "bg-sunken text-ink" : "text-ink"
                }`}
              >
                <span className="flex-1">{o.label}</span>
                {o.done && (
                  <span
                    className="flex items-center gap-1 text-[11px] text-muted"
                    title="Already generated at this tone"
                  >
                    <Check size={12} />
                    saved
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
