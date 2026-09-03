import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

const STYLE = {
  danger: {
    box: "border-danger/30 bg-danger-soft text-danger",
    Icon: CircleAlert,
  },
  info: {
    box: "border-line-strong bg-sunken text-muted",
    Icon: Info,
  },
} as const;

export default function Alert({
  variant = "info",
  children,
  className = "",
}: {
  variant?: keyof typeof STYLE;
  children: ReactNode;
  className?: string;
}) {
  const { box, Icon } = STYLE[variant];
  return (
    <div
      className={`flex items-start gap-2 rounded-[var(--radius)] border px-3 py-2 text-[12px] leading-relaxed ${box} ${className}`}
    >
      <Icon size={14} className="mt-[1px] shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
