export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-[6px] ${className}`} />;
}
