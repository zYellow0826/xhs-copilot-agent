"use client";

import { useState } from "react";

import AgentProgress from "@/components/AgentProgress";
import GenerationForm, { type FormValues } from "@/components/GenerationForm";
import NoteCard, { type XhsNote } from "@/components/NoteCard";

type GenerationOutput = {
  notes: XhsNote[];
  reasoning: string;
};

const EVENT_LABELS: Record<string, string> = {
  on_chain_start: "启动 workflow",
  on_chat_model_start: "调用 DeepSeek",
  on_chat_model_stream: "生成中",
  on_chat_model_end: "模型返回",
  on_tool_start: "解析工具调用",
  on_tool_end: "结构化完成",
  on_chain_end: "完成",
};

type SseEvent = {
  event?: string;
  name?: string;
  message?: string;
  data?: unknown;
};

export default function Home() {
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [output, setOutput] = useState<GenerationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setStreaming(true);
    setEvents([]);
    setOutput(null);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok || !res.body) {
        let detail = `upstream ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = raw.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          let evt: SseEvent;
          try {
            evt = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (evt.event === "error") {
            throw new Error(evt.message || evt.name || "生成失败");
          }

          const label = EVENT_LABELS[evt.event ?? ""];
          if (label) setEvents((prev) => [...prev, label]);

          if (
            evt.event === "on_chain_end" &&
            evt.name === "LangGraph" &&
            evt.data &&
            typeof evt.data === "object" &&
            "output" in evt.data
          ) {
            const finalState = (evt.data as { output: { output: GenerationOutput | null } }).output;
            if (finalState?.output) setOutput(finalState.output);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreaming(false);
    }
  }

  const showEmpty = !streaming && !output && !error && events.length === 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">小红书运营 Copilot</h1>
        <p className="mt-1 text-sm text-neutral-500">
          填入店铺信息，生成 1-3 篇可直接发布的小红书笔记。
        </p>
      </header>

      <GenerationForm onSubmit={onSubmit} disabled={streaming} />

      {(streaming || events.length > 0) && (
        <section className="mt-8">
          <AgentProgress events={events} streaming={streaming} />
        </section>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          出错了：{error}
        </p>
      )}

      {output && (
        <section className="mt-8 space-y-6">
          <div className="rounded border border-neutral-200 bg-white px-4 py-3 text-sm">
            <div className="mb-1 font-medium text-neutral-700">选题思路</div>
            <p className="whitespace-pre-line text-neutral-600">{output.reasoning}</p>
          </div>
          <div className="space-y-4">
            {output.notes.map((note, i) => (
              <NoteCard key={i} note={note} index={i} />
            ))}
          </div>
        </section>
      )}

      {showEmpty && (
        <section className="mt-12 rounded border border-dashed border-neutral-300 bg-white/60 px-6 py-10 text-center">
          <p className="text-sm text-neutral-500">
            填好表单点击「生成笔记」，1-3 篇可直接发布的小红书笔记会在这里出现。
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            内置方法论会强制约束标题钩子、违禁词、字数等硬规则。
          </p>
        </section>
      )}

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-400">
        <p>
          <a
            href="https://github.com/zYellow0826/xhs-copilot"
            className="hover:text-xhs-pink"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          {" · "}
          MIT License · 内容由 DeepSeek 生成，发布前请人工 review
        </p>
      </footer>
    </main>
  );
}
