import Link from "next/link";
import Logo from "../Logo";

export default function SiteHeader() {
  return (
    <header>
      <div className="mx-auto flex h-19 max-w-6xl items-center gap-6 px-6">
        <Logo />
        <nav className="ml-auto flex items-center gap-6">
          <Link
            href="/studio"
            className="inline-flex h-9 items-center rounded-[var(--radius)] bg-cobalt px-4 text-[14px] font-semibold text-on-cobalt transition-colors hover:bg-cobalt-hi"
          >
            Open studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
