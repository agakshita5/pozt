import type { ReactNode } from "react";

export default function Panel({
  header,
  children,
  className = "",
  bodyClassName = "",
}: {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      {header && (
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          {header}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
