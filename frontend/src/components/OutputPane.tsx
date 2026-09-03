"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import PlatformIcon from "./PlatformIcon";
import Preview from "./previews/Preview";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Skeleton from "./ui/Skeleton";
import Tabs from "./ui/Tabs";
import { PLATFORM_META } from "@/lib/platforms";
import { toPlainText } from "@/lib/serialize";
import {
  PLATFORMS,
  type Platform,
  type PostsForTone,
  type Tone,
} from "@/lib/types";

function LoadingState() {
  return (
    <div className="mx-auto max-w-[560px] space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
        >
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props {
  /** Posts for the tone currently selected, or null if this tone has none yet. */
  posts: PostsForTone | null;
  tone: Tone;
  hasRun: boolean;
  loading: boolean;
  active: Platform;
  onActiveChange: (p: Platform) => void;
  onRegenerate: (p: Platform) => void;
  regenerating: Platform | null;
}

export default function OutputPane({
  posts,
  tone,
  hasRun,
  loading,
  active,
  onActiveChange,
  onRegenerate,
  regenerating,
}: Props) {
  const post = posts?.[active] ?? null;

  // Key the "Copied" flash to the exact post that was copied, so switching tabs
  // or regenerating clears it without an effect.
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const postKey = post ? `${active}:${post.tone}:${post.regens_remaining}` : "";
  const copied = postKey !== "" && copiedKey === postKey;

  async function copy() {
    if (!post) return;
    await navigator.clipboard.writeText(toPlainText(active, post.payload));
    setCopiedKey(postKey);
    setTimeout(() => setCopiedKey(null), 1600);
  }

  const busy = regenerating === active;
  const exhausted = post ? post.regens_remaining === 0 : false;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3">
        <Tabs
          value={active}
          onChange={onActiveChange}
          items={PLATFORMS.map((p) => ({
            value: p,
            label: PLATFORM_META[p].label,
            icon: <PlatformIcon platform={p} size={14} />,
            flagged: Boolean(posts?.[p]?.over_limit?.length),
          }))}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={copy}
            disabled={!post || busy}
            icon={copied ? Check : Copy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            onClick={() => onRegenerate(active)}
            disabled={!post || busy || exhausted}
            loading={busy}
            icon={RefreshCw}
            title={
              exhausted
                ? `No regenerations left for ${PLATFORM_META[active].label} at the "${post?.tone}" tone. Switch tone for a fresh set.`
                : undefined
            }
          >
            {busy
              ? "Regenerating"
              : `Regenerate${post ? ` (${post.regens_remaining} left)` : ""}`}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-bone p-5">
        {loading || busy ? (
          <LoadingState />
        ) : !post ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-[13px] leading-relaxed text-muted">
            {hasRun ? (
              <span>
                Nothing generated at the{" "}
                <span className="font-medium text-ink">{tone}</span> tone yet.
                <br />
                Hit Generate to add it. Your other tones stay saved.
              </span>
            ) : (
              <span>
                Previews land here.
                <br />
                Paste a blog URL or its text on the left, then hit Generate.
              </span>
            )}
          </div>
        ) : (
          <>
            {post.over_limit.length > 0 && (
              <Alert variant="danger" className="mx-auto mb-4 max-w-[620px]">
                Over {PLATFORM_META[active].label}&apos;s limit:{" "}
                {post.over_limit.join(", ")}. Regenerate or trim before posting.
              </Alert>
            )}
            <Preview platform={active} payload={post.payload} />
            <div className="mt-4 text-center text-[11px] text-muted">
              {tone} tone
            </div>
          </>
        )}
      </div>
    </section>
  );
}
