export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width="24"
      height="24"
      fill="none"
      aria-hidden
    >
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
      <path
        d="M7 12h4M11 12V3.5h6M11 12V20.5h6M11 12h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <rect x="17" y="1" width="5" height="5" rx="1.3" fill="currentColor" />
      <rect x="17" y="6.5" width="5" height="5" rx="1.3" fill="currentColor" opacity="0.7" />
      <rect x="17" y="12.5" width="5" height="5" rx="1.3" fill="currentColor" opacity="0.7" />
      <rect x="17" y="18" width="5" height="5" rx="1.3" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark className="text-cobalt" />
      <span className="font-display text-[24px] font-semibold tracking-tight text-ink">
        PoZt
      </span>
    </span>
  );
}
