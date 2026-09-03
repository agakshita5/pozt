"use client";

import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-cobalt text-on-cobalt hover:bg-cobalt-hi disabled:hover:bg-cobalt font-semibold",
  secondary:
    "bg-surface text-ink border border-line hover:border-line-strong hover:bg-sunken",
  ghost: "text-muted hover:text-ink hover:bg-sunken",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
}

export default function Button({
  variant = "secondary",
  size = "sm",
  icon: Icon,
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {loading ? (
        <LoaderCircle size={size === "sm" ? 14 : 16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : 16} />
      ) : null}
      {children}
    </button>
  );
}
