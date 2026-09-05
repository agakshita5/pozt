import { ArrowRight } from "lucide-react";
import Link from "next/link";
import SiteHeader from "@/components/landing/SiteHeader";
import FallingPreviews from "@/components/landing/FallingPreviews";

export default function Landing() {
  return (
    <div className="min-h-full">
      <SiteHeader />

      <section className="mx-auto max-w px-6 pb-8 pt-24 text-center lg:pt-32">
        <h1 className="font-display text-[44px] font-semibold leading-[1.03] tracking-[-0.025em] sm:text-[64px]">
          Multiple platforms. One paste.
        </h1>

        <p className="mx-auto mt-6 max-w text-[17px] leading-relaxed text-muted">
          Turn any article into native posts you can see before you ship them. 
          <br />
          An X thread, an Instagram caption, a LinkedIn post or a Reddit thread, each rendered in the shape it will actually land in.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/studio"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius)] bg-cobalt px-5 text-[14px] font-semibold text-on-cobalt transition-colors hover:bg-cobalt-hi"
          >
            Open studio
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <FallingPreviews />
    </div>
  );
}
