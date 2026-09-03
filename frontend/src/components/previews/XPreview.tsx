import { BadgeCheck, BarChart3, Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { XPayload } from "@/lib/types";

const LIMIT = 280;

export default function XPreview({ payload }: { payload: XPayload }) {
  const { tweets = [], hashtags = [] } = payload;
  const tags = hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");

  return (
    <div className="mx-auto max-w-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-[#2f3336] bg-black text-[15px] leading-normal text-[#e7e9ea]">
      {tweets.map((tweet, i) => {
        const isLast = i === tweets.length - 1;
        const body = isLast && tags ? `${tweet}\n\n${tags}` : tweet;
        const over = body.length > LIMIT;

        return (
          <article
            key={i}
            className={`flex gap-3 px-4 py-3 ${isLast ? "" : "border-b border-[#2f3336]"}`}
          >
            <div className="relative flex flex-col items-center">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" />
              {!isLast && <div className="mt-1 w-0.5 grow rounded bg-[#2f3336]" />}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-1 text-[15px]">
                <span className="font-bold">You</span>
                <BadgeCheck size={16} className="text-[#1D9BF0]" />
                <span className="text-[#71767b]">@you</span>
                <span className="text-[#71767b]">·</span>
                <span className="text-[#71767b]">now</span>
              </div>

              <p className="mt-0.5 whitespace-pre-wrap break-words">{body}</p>

              <div className="mt-3 flex max-w-[420px] items-center justify-between text-[13px] text-[#71767b]">
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={16} />
                  12
                </span>
                <span className="flex items-center gap-1.5">
                  <Repeat2 size={17} />
                  34
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart size={16} />
                  210
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={16} />
                  8.4K
                </span>
                <span
                  className={
                    over ? "font-semibold text-danger" : "tabular-nums text-[#71767b]"
                  }
                >
                  {body.length}/{LIMIT}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
