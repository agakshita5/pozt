"use client";

import {
  Globe,
  Heart,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Send,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import type { LinkedInPayload } from "@/lib/types";

const ACTIONS = [
  { label: "Like", Icon: ThumbsUp },
  { label: "Comment", Icon: MessageSquare },
  { label: "Repost", Icon: Repeat2 },
  { label: "Send", Icon: Send },
];

/** The stacked reaction pills LinkedIn shows above the comment count. */
const REACTIONS = [
  { Icon: ThumbsUp, bg: "#378FE9" },
  { Icon: Heart, bg: "#DF704D" },
  { Icon: Lightbulb, bg: "#F5BB5C" },
];

export default function LinkedInPreview({
  payload,
}: {
  payload: LinkedInPayload;
}) {
  const [expanded, setExpanded] = useState(false);
  const { body = "", hashtags = [] } = payload;
  const tags = hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  const full = tags ? `${body}\n\n${tags}` : body;
  const foldable = full.length > 220;

  return (
    <div className="mx-auto max-w-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-[#38434f] bg-[#1b1f23] text-[14px] text-[#ffffffe6]">
      <header className="flex items-start gap-2 px-4 pt-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-[#0A66C2] to-cyan-400" />
        <div className="min-w-0 pt-0.5">
          <div className="text-[14px] font-semibold leading-tight">You</div>
          <div className="truncate text-[12px] leading-tight text-[#ffffff99]">
            Building things · 3,204 followers
          </div>
          <div className="flex items-center gap-1 text-[12px] leading-tight text-[#ffffff99]">
            2h <Globe size={12} />
          </div>
        </div>
        <MoreHorizontal size={18} className="ml-auto text-[#ffffff99]" />
      </header>

      <div className="px-4 pb-2 pt-3">
        <p
          className={`whitespace-pre-wrap break-words text-[14px] leading-[1.45] ${
            foldable && !expanded ? "clamp-3" : ""
          }`}
        >
          {full}
        </p>
        {foldable && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-0.5 text-[14px] text-[#ffffff99] hover:text-[#70b5f9] hover:underline"
          >
            …see more
          </button>
        )}
      </div>

      <div className="mx-4 flex items-center gap-1.5 border-b border-[#38434f] pb-1.5 text-[12px] text-[#ffffff99]">
        <span className="flex -space-x-1">
          {REACTIONS.map(({ Icon, bg }, i) => (
            <span
              key={i}
              className="grid h-4 w-4 place-items-center rounded-full ring-[1.5px] ring-[#1b1f23]"
              style={{ background: bg }}
            >
              <Icon size={9} className="text-white" fill="currentColor" />
            </span>
          ))}
        </span>
        <span>128</span>
        <span className="ml-auto">17 comments · 4 reposts</span>
      </div>

      <div className="flex items-center justify-around px-2 py-1 text-[14px] font-semibold text-[#ffffff99]">
        {ACTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            className="flex items-center gap-1.5 rounded px-3 py-2.5 hover:bg-[#ffffff14]"
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
