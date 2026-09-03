import {
  ArrowBigDown,
  ArrowBigUp,
  Bookmark,
  MessageSquare,
  Share2,
} from "lucide-react";
import type { RedditPayload } from "@/lib/types";

/** Just enough Markdown to make the body read like Reddit renders it. */
function renderBody(body: string) {
  return body.split("\n").map((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) return <div key={i} className="h-2.5" />;

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      return (
        <p key={i} className="mt-3 mb-1 text-[16px] font-bold">
          {heading[2]}
        </p>
      );
    }

    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <p key={i} className="ml-4 flex gap-2">
          <span className="text-[#7c7c7c]" aria-hidden>
            &bull;
          </span>
          <span>{inline(trimmed.replace(/^[-*]\s+/, ""))}</span>
        </p>
      );
    }

    const numbered = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (numbered) {
      return (
        <p key={i} className="ml-4 flex gap-2">
          <span className="text-[#7c7c7c]">{numbered[1]}.</span>
          <span>{inline(numbered[2])}</span>
        </p>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <p key={i} className="border-l-2 border-[#4a4a4a] pl-3 text-[#b8b8b8]">
          {inline(trimmed.slice(2))}
        </p>
      );
    }

    return <p key={i}>{inline(trimmed)}</p>;
  });
}

/** Bold and inline code, the two that actually show up. */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-[#272729] px-1 py-0.5 font-mono text-[12px] text-[#ff8b60]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function RedditPreview({ payload }: { payload: RedditPayload }) {
  const { title = "", body = "", suggested_subreddits = [] } = payload;
  const primary = suggested_subreddits[0] ?? "programming";

  return (
    <div className="mx-auto max-w-[620px]">
      <div className="flex overflow-hidden rounded-[var(--radius-lg)] border border-[#343536] bg-[#1a1a1b] text-[14px] text-[#d7dadc]">
        <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 bg-[#161617] pt-2 text-[#818384]">
          <ArrowBigUp size={20} />
          <span className="text-[12px] font-bold text-[#d7dadc]">2.4k</span>
          <ArrowBigDown size={20} />
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-center gap-1.5 text-[12px]">
            <div className="h-5 w-5 rounded-full bg-[#FF4500]" />
            <span className="font-bold text-[#d7dadc]">r/{primary}</span>
            <span className="text-[#818384]">· Posted by u/you 2 hours ago</span>
          </div>

          <h3 className="mt-1.5 text-[18px] font-medium leading-snug">{title}</h3>
          {title.length > 300 && (
            <div className="mt-1 text-[12px] font-semibold text-danger">
              Title is {title.length} characters. Reddit caps titles at 300.
            </div>
          )}

          <div className="mt-2 text-[14px] leading-[1.5]">{renderBody(body)}</div>

          <div className="mt-3 flex items-center gap-4 text-[12px] font-bold text-[#818384]">
            <span className="flex items-center gap-1.5">
              <MessageSquare size={16} />
              184 Comments
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 size={16} />
              Share
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark size={16} />
              Save
            </span>
          </div>
        </div>
      </div>

      {suggested_subreddits.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span>Also consider:</span>
          {suggested_subreddits.slice(1).map((s) => (
            <span
              key={s}
              className="rounded-full border border-line bg-surface px-2.5 py-1 text-ink"
            >
              r/{s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
