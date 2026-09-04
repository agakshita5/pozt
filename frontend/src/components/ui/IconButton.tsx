"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  // Required: every icon-only control needs a name for hover and for screen readers
  title: string;
  size?: number;
  danger?: boolean;
}

export default function IconButton({
  icon: Icon,
  title,
  size = 16,
  danger = false,
  className = "",
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      title={title}
      aria-label={title}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-muted transition-colors hover:bg-sunken ${
        danger ? "hover:text-danger" : "hover:text-ink"
      } disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}
