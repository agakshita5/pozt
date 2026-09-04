"use client";

import { AlignLeft, Link2 } from "lucide-react";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Tabs from "./ui/Tabs";
import {
  MAX_INPUT_CHARS,
  TONES,
  type SourceType,
  type Tone,
} from "@/lib/types";

interface Props {
  sourceType: SourceType;
  onSourceTypeChange: (t: SourceType) => void;
  url: string;
  onUrlChange: (v: string) => void;
  text: string;
  onTextChange: (v: string) => void;
  tone: Tone;
  onToneChange: (t: Tone) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  notice: string | null;
  // this input already has posts at the selected tone, so Generate is a no-op
  alreadyGenerated: boolean;
  generatedTones: Tone[];
}

export default function InputPane({
  sourceType,
  onSourceTypeChange,
  url,
  onUrlChange,
  text,
  onTextChange,
  tone,
  onToneChange,
  onGenerate,
  loading,
  error,
  notice,
  alreadyGenerated,
  generatedTones,
}: Props) {
  const count = text.length;
  const nearLimit = count > MAX_INPUT_CHARS;
  const hasInput = sourceType === "url" ? url.trim().length > 4 : count >= 100;
  const ready = hasInput && !alreadyGenerated;

  return (
    <section className="flex min-h-0 w-full flex-col border-line lg:w-[42%] lg:border-r">
      <div className="flex h-12 shrink-0 items-center border-b border-line px-3">
        <Tabs
          value={sourceType}
          onChange={onSourceTypeChange}
          items={[
            { value: "url", label: "Blog URL", icon: <Link2 size={14} /> },
            { value: "text", label: "Paste text", icon: <AlignLeft size={14} /> },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {sourceType === "url" ? (
          <div className="space-y-2">
            <input
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ready && !loading) onGenerate();
              }}
              placeholder="https://example.com/blog/my-post"
              spellCheck={false}
              className="w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted/60 hover:border-line-strong focus:border-cobalt"
            />
            <p className="text-[12px] leading-relaxed text-muted">
              The article is fetched and stripped of navigation and boilerplate.
              Paywalled or JavaScript-only pages will not extract; paste the text
              instead.
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <textarea
              value={text}
              onChange={(e) =>
                onTextChange(e.target.value.slice(0, MAX_INPUT_CHARS))
              }
              maxLength={MAX_INPUT_CHARS}
              placeholder="Paste the blog post here…"
              className="min-h-[240px] flex-1 resize-none rounded-[var(--radius)] border border-line bg-surface p-3 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/60 hover:border-line-strong focus:border-cobalt"
            />
            <div className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className="text-muted">
                {count > 0 && count < 100 ? "Needs at least 100 characters" : ""}
              </span>
              <span
                className={`tabular-nums ${nearLimit ? "font-medium text-danger" : "text-muted"}`}
              >
                {count.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-muted">Tone</span>
          <Select
            label="Tone"
            value={tone}
            onChange={onToneChange}
            options={TONES.map((t) => ({
              value: t,
              label: t,
              done: generatedTones.includes(t),
            }))}
          />

          <Button
            variant="primary"
            size="md"
            onClick={onGenerate}
            disabled={!ready}
            loading={loading}
            className="ml-auto"
            title={
              alreadyGenerated
                ? `Already generated at the ${tone} tone. Use Regenerate for different wording.`
                : undefined
            }
          >
            {loading
              ? "Generating"
              : alreadyGenerated
                ? "Already generated"
                : `Generate ${tone}`}
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {notice && !error && <Alert variant="info">{notice}</Alert>}
        {alreadyGenerated && !error && (
          <Alert variant="info">
            Showing your saved <span className="text-ink">{tone}</span> posts.
            Switch tone to generate another set, or use Regenerate for different
            wording at this one. Saved tones are marked in the dropdown.
          </Alert>
        )}
      </div>
    </section>
  );
}
