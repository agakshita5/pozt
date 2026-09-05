"use client";

import { PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "./Logo";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";
import type { RunSummary } from "@/lib/types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface Props {
  runs: RunSummary[];
  activeId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function Sidebar({
  runs,
  activeId,
  collapsed,
  onToggle,
  onSelect,
  onDelete,
  onNew,
}: Props) {
  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="flex h-15 shrink-0 items-center gap-2 border-b border-line px-3">
        <Link href="/" title="PoZt home" className="flex items-center">
          <LogoMark className="text-cobalt" />
        </Link>
        {!collapsed && (
          <span className="font-display truncate text-[18px] font-semibold tracking-tight">
            PoZt
          </span>
        )}
        <IconButton
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          title={collapsed ? "Expand history" : "Collapse history"}
          onClick={onToggle}
          className={collapsed ? "hidden" : "ml-auto"}
        />
      </div>

      <div className="p-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <IconButton
              icon={PanelLeftOpen}
              title="Expand history"
              onClick={onToggle}
            />
            <IconButton icon={Plus} title="New post" onClick={onNew} />
          </div>
        ) : (
          <Button icon={Plus} onClick={onNew} className="w-full justify-start">
            New post
          </Button>
        )}
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-1 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted">
            History
          </div>
          {runs.length === 0 ? (
            <p className="px-1 py-2 text-[12px] leading-relaxed text-muted">
              Nothing yet. Your generated posts show up here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {runs.map((run) => (
                <li key={run.id} className="group relative">
                  <button
                    onClick={() => onSelect(run.id)}
                    className={`w-full rounded-[var(--radius)] px-2.5 py-2 pr-8 text-left transition-colors ${
                      run.id === activeId
                        ? "bg-cobalt-soft text-ink"
                        : "text-ink hover:bg-sunken"
                    }`}
                  >
                    <div className="truncate text-[13px] leading-snug">
                      {run.title || "Untitled"}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted">
                      {relativeTime(run.created_at)} · {run.tone}
                    </div>
                  </button>
                  <IconButton
                    icon={Trash2}
                    title="Delete this run"
                    danger
                    size={14}
                    onClick={() => onDelete(run.id)}
                    className="absolute right-1 top-1.5 hidden group-hover:grid"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
