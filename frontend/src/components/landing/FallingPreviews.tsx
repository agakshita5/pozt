"use client";

import { useEffect, useRef } from "react";
import BackgroundBlocks from "./BackgroundBlocks";
import PlatformIcon from "../PlatformIcon";
import Preview from "../previews/Preview";
import { PLATFORM_META } from "@/lib/platforms";
import { SAMPLE_POSTS } from "@/lib/sampleRun";
import { PLATFORMS, type Platform } from "@/lib/types";

/**
 * Scatter table. Deterministic on purpose: Math.random() at render time gives
 * the server and the client different values and breaks hydration, so the
 * "randomness" is authored once here instead.
 */
const SCATTER: Record<
  Platform,
  { x: string; enter: string; rest: string; delay: string }
> = {
  x: { x: "-7%", enter: "-6deg", rest: "-1.8deg", delay: "0ms" },
  instagram: { x: "9%", enter: "7deg", rest: "2.1deg", delay: "60ms" },
  linkedin: { x: "-4%", enter: "5deg", rest: "2.6deg", delay: "40ms" },
  reddit: { x: "6%", enter: "-8deg", rest: "-1.4deg", delay: "80ms" },
};

/** Distance from the viewport's middle, as a fraction of its height. */
const HOLD = 0.12; // inside this, fully opaque
const FADE = 0.68; // by this far out, down to the floor
const FLOOR = 0.1;

function FallingCard({ platform }: { platform: Platform }) {
  const ref = useRef<HTMLDivElement>(null);
  const meta = PLATFORM_META[platform];
  const post = SAMPLE_POSTS[platform];
  const scatter = SCATTER[platform];

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        // One-way: once it has landed it stays landed, so scrolling back up
        // does not re-trigger the drop.
        if (entry.isIntersecting) {
          node.classList.add("is-landed");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  if (!post) return null;

  return (
    // Outer element owns the scroll-driven fade; the inner one owns the fall,
    // so the two never fight over `transform` or `opacity`.
    <div data-card className="py-10" style={{ willChange: "opacity, transform" }}>
      <div style={{ transform: `translateX(${scatter.x})` }}>
        <div
          ref={ref}
          className="fall-in mx-auto w-full max-w-[600px] overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-lift)]"
          style={
            {
              "--enter-tilt": scatter.enter,
              "--rest-tilt": scatter.rest,
              "--fall-delay": scatter.delay,
            } as React.CSSProperties
          }
        >
          <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <PlatformIcon
              platform={platform}
              size={16}
              style={{ color: meta.brand }}
            />
            <span className="text-[14px] font-semibold">{meta.label}</span>
            <span className="ml-auto text-[12px] text-muted">{meta.limit}</span>
          </header>

          {/* No height cap. X and Reddit have no native fold, so they show in
              full; Instagram and LinkedIn carry their own "... more" and
              "…see more", which is the only expand control the card needs. */}
          <div className="bg-bone p-5">
            <Preview platform={platform} payload={post.payload} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FallingPreviews() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [],
    );
    let frame = 0;

    const apply = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        // Zero while the viewport's middle is anywhere inside the card, so a
        // post taller than the screen stays fully lit the whole way past.
        const gap = Math.max(0, rect.top - middle, middle - rect.bottom);
        const d = gap / window.innerHeight;
        const t = Math.min(1, Math.max(0, (d - HOLD) / (FADE - HOLD)));
        const opacity = FLOOR + (1 - FLOOR) * (1 - t);
        card.style.opacity = String(opacity);
        card.style.transform = `scale(${1 - t * 0.04})`;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="relative">
      <BackgroundBlocks />

      <div ref={root} className="relative mx-auto max-w-2xl px-6 pb-28 pt-10">
        {PLATFORMS.map((platform) => (
          <FallingCard key={platform} platform={platform} />
        ))}
      </div>
    </div>
  );
}
