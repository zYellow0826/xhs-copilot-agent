"use client";

import { useState } from "react";

export type XhsNote = {
  title: string;
  body: string;
  tags: string[];
  cover_copy: string;
};

export default function NoteCard({ note, index }: { note: XhsNote; index: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = `${note.title}\n\n${note.body}\n\n${note.tags
      .map((t) => `#${t}`)
      .join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <span className="text-xs text-neutral-400">笔记 #{index + 1}</span>
        <button
          onClick={copy}
          className="text-xs text-neutral-500 hover:text-xhs-pink"
        >
          {copied ? "已复制" : "复制"}
        </button>
      </header>

      <h2 className="mb-2 text-lg font-semibold leading-snug">{note.title}</h2>

      <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-neutral-800">
        {note.body}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {note.tags.map((t) => (
          <span
            key={t}
            className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
          >
            #{t}
          </span>
        ))}
      </div>

      <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        <span className="mr-2 font-medium">封面文案：</span>
        {note.cover_copy}
      </div>
    </article>
  );
}
