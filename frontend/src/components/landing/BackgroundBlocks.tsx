"use client";

import { useEffect, useRef } from "react";

/**
 * A field of geometric blocks drifting behind the preview deck. Each block
 * parallaxes at its own rate as the section scrolls, on top of a slow idle
 * sway from CSS so the field is never completely still.
 *
 * Positions are a fixed table rather than Math.random(), because anything
 * random at render time differs between the server and the client and blows up
 * hydration.
 */
const BLOCKS = [
  { top: "4%", left: "6%", size: 132, speed: -0.16, rotate: -8, fill: false, tint: false },
  { top: "8%", left: "78%", size: 76, speed: 0.24, rotate: 12, fill: true, tint: false },
  { top: "10%", left: "88%", size: 168, speed: -0.1, rotate: 6, fill: false, tint: true },
  { top: "21%", left: "5%", size: 96, speed: -0.14, rotate: 13, fill: true, tint: false },
  { top: "24%", left: "8%", size: 60, speed: 0.22, rotate: -18, fill: false, tint: false },
  { top: "32%", left: "82%", size: 60, speed: 0.22, rotate: -18, fill: false, tint: false },
  { top: "37%", left: "84%", size: 104, speed: -0.22, rotate: 18, fill: false, tint: false },
  { top: "42%", left: "10%", size: 190, speed: 0.12, rotate: -5, fill: false, tint: false },
  { top: "50%", left: "70%", size: 64, speed: -0.28, rotate: 22, fill: true, tint: true },
  { top: "57%", left: "1%", size: 118, speed: 0.2, rotate: 9, fill: false, tint: false },
  { top: "50%", left: "90%", size: 150, speed: 0.15, rotate: -12, fill: false, tint: false },
  { top: "64%", left: "90%", size: 88, speed: 0.15, rotate: -11, fill: true, tint: false },
  { top: "71%", left: "14%", size: 70, speed: -0.19, rotate: 16, fill: false, tint: true },
  { top: "79%", left: "76%", size: 152, speed: 0.26, rotate: -7, fill: false, tint: false },
  { top: "86%", left: "5%", size: 96, speed: -0.14, rotate: 13, fill: true, tint: false },
  { top: "92%", left: "82%", size: 60, speed: 0.22, rotate: -18, fill: false, tint: false },
  { top: "90%", left: "15%", size: 120, speed: 0.15, rotate: 11, fill: true, tint: false },
  { top: "98%", left: "90%", size: 88, speed: 0.15, rotate: -11, fill: false, tint: false },
];

export default function BackgroundBlocks() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-speed]") ?? [],
    );
    let frame = 0;

    const apply = () => {
      frame = 0;
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      // How far the section has travelled through the viewport, in pixels.
      const travelled = window.innerHeight - rect.top;
      nodes.forEach((node) => {
        const speed = Number(node.dataset.speed);
        node.style.setProperty("--shift", `${travelled * speed}px`);
      });
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
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {BLOCKS.map((b, i) => (
        <div
          key={i}
          data-speed={b.speed}
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            transform: "translateY(var(--shift, 0px))",
          }}
          className="absolute"
        >
          <div
            className={`bg-block h-full w-full rounded-[14px] border ${
              b.tint ? "border-cobalt/25" : "border-line"
            } ${b.fill ? "bg-sunken/40" : ""}`}
            style={
              {
                "--sway": `${b.rotate}deg`,
                "--sway-dur": `${12 + (i % 5) * 2.5}s`,
                "--sway-delay": `${(i % 7) * 0.6}s`,
                rotate: `${b.rotate / 2}deg`,
              } as React.CSSProperties
            }
          />
        </div>
      ))}
    </div>
  );
}
