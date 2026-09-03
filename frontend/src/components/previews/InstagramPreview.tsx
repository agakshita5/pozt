"use client";

import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useState } from "react";
import type { InstagramPayload } from "@/lib/types";

const FOLD = 125;

export default function InstagramPreview({
  payload,
}: {
  payload: InstagramPayload;
}) {
  const [expanded, setExpanded] = useState(false);
  const { caption = "", hashtags = [] } = payload;
  const folded = caption.length > FOLD && !expanded;
  const shown = folded ? caption.slice(0, FOLD).trimEnd() : caption;

  return (
    <div className="mx-auto max-w-[420px] overflow-hidden rounded-[var(--radius-lg)] border border-[#262626] bg-black text-[14px] text-[#f5f5f5]">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#F56040] to-[#833AB4] p-[2px]">
          <div className="h-8 w-8 rounded-full border-2 border-black bg-neutral-700" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight">you</div>
          <div className="text-[11px] leading-tight text-[#a8a8a8]">
            Original audio
          </div>
        </div>
        <MoreHorizontal size={18} className="ml-auto text-[#f5f5f5]" />
      </header>

      <div className="relative aspect-square w-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-orange-400">
        <span className="absolute inset-0 grid place-items-center px-6 text-center text-[11px] font-medium uppercase tracking-widest text-white/80">
          image placeholder
        </span>
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <div className="flex items-center gap-4 text-[#f5f5f5]">
          <Heart size={22} />
          <MessageCircle size={22} />
          <Send size={22} />
          <Bookmark size={22} className="ml-auto" />
        </div>
        <div className="mt-2 text-[13px] font-semibold">1,204 likes</div>

        <p className="mt-1 whitespace-pre-wrap break-words leading-[1.45]">
          <span className="mr-1.5 font-semibold">you</span>
          {shown}
          {folded && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-1 text-[#a8a8a8] hover:text-[#f5f5f5]"
            >
              ... more
            </button>
          )}
        </p>

        {hashtags.length > 0 && (
          <p className="mt-2 break-words text-[13px] leading-[1.5] text-[#e0f1ff]">
            {hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
          </p>
        )}

        <div className="mt-2 text-[11px] uppercase tracking-wide text-[#a8a8a8]">
          2 hours ago
        </div>
      </div>
    </div>
  );
}
