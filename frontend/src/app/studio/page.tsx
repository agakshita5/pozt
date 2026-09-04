"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import InputPane from "@/components/InputPane";
import OutputPane from "@/components/OutputPane";
import Sidebar from "@/components/Sidebar";
import { sidebarStore } from "@/lib/sidebarStore";
import { createRun, deleteRun, errorMessage, getRun, listRuns, regeneratePost, setTokenGetter} from "@/lib/api";
import type { Platform, Run, RunSummary, SourceType, Tone } from "@/lib/types";

export default function Home() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const collapsed = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
    sidebarStore.getServerSnapshot,
  );

  const { isLoaded, getToken } = useAuth();
  setTokenGetter(() => getToken());

  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("professional");

  const [active, setActive] = useState<Platform>("x");
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshRuns = useCallback(async () => {
    try {
      setRuns(await listRuns());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    listRuns()
      .then(setRuns)
      .catch((e) => setError(errorMessage(e)));
  }, [isLoaded]);

  function startNew() {
    setRun(null);
    setUrl("");
    setText("");
    setError(null);
    setNotice(null);
  }

  function loadIntoPanes(loaded: Run, keepTone = false) {
    setRun(loaded);
    if (!keepTone) setTone(loaded.tone);
    setSourceType(loaded.source_type);
    if (loaded.source_type === "url") {
      setUrl(loaded.source);
      setText(loaded.extracted_text);
    } else {
      setText(loaded.source);
    }
    setNotice(
      loaded.truncated
        ? "The article was longer than 15,000 characters, so it was trimmed before generating."
        : null,
    );
  }

  async function handleSelect(id: string) {
    setError(null);
    try {
      loadIntoPanes(await getRun(id));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRun(id);
      if (run?.id === id) startNew();
      await refreshRuns();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createRun(
        sourceType,
        sourceType === "url" ? url : text,
        tone,
      );
      loadIntoPanes(created, true);
      await refreshRuns();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate(platform: Platform) {
    if (!run) return;
    setRegenerating(platform);
    setError(null);
    try {
      const post = await regeneratePost(run.id, platform, tone);
      setRun({
        ...run,
        posts_by_tone: {
          ...run.posts_by_tone,
          [tone]: { ...run.posts_by_tone[tone], [platform]: post },
        },
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRegenerating(null);
    }
  }

  const posts = run?.posts_by_tone?.[tone] ?? null;
  
  const sourceUnchanged =
    run !== null &&
    run.source_type === sourceType &&
    run.source.trim() === (sourceType === "url" ? url : text).trim();
  const alreadyGenerated = sourceUnchanged && posts !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-bone">
      <Sidebar
        runs={runs}
        activeId={run?.id ?? null}
        collapsed={collapsed}
        onToggle={sidebarStore.toggle}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onNew={startNew}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-15 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
          <span className="truncate text-[15px] text-muted">
            {run ? run.title : "Blog in, four platform-ready posts out"}
          </span>
          <Link
            href="/"
            className="ml-auto flex items-center gap-1.5 text-[15px] text-muted transition-colors hover:text-cobalt"
          >
            <ArrowLeft size={13} />
            Home
          </Link>
          <div className="ml-4 flex items-center">
            <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-surface lg:flex-row">
          <InputPane
            sourceType={sourceType}
            onSourceTypeChange={setSourceType}
            url={url}
            onUrlChange={setUrl}
            text={text}
            onTextChange={setText}
            tone={tone}
            onToneChange={setTone}
            onGenerate={handleGenerate}
            loading={loading}
            error={error}
            notice={notice}
            alreadyGenerated={alreadyGenerated}
            generatedTones={
              run ? (Object.keys(run.posts_by_tone) as Tone[]) : []
            }
          />
          <OutputPane
            posts={posts}
            tone={tone}
            hasRun={run !== null}
            loading={loading}
            active={active}
            onActiveChange={setActive}
            onRegenerate={handleRegenerate}
            regenerating={regenerating}
          />
        </div>
      </main>
    </div>
  );
}
