"use client";

import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Small red dot on the tab, for the over-limit warning. */
  flagged?: boolean;
}

/**
 * Underline tabs with a cobalt indicator. Shared by the input source tabs and
 * the platform tabs so the two rows read as the same control.
 */
export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={`flex items-center gap-0.5 ${className}`}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`relative flex h-12 items-center gap-2 px-3 text-[13px] font-medium transition-colors ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.icon}
            {item.label}
            {item.flagged && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-danger"
                title="Over the platform limit"
              />
            )}
            <span
              className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full transition-colors ${
                active ? "bg-cobalt" : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
