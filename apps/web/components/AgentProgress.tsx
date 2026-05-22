"use client";

export default function AgentProgress({
  events,
  streaming,
}: {
  events: string[];
  streaming: boolean;
}) {
  const latest = events[events.length - 1] ?? "等待中";

  return (
    <div className="rounded border border-neutral-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            streaming ? "animate-pulse bg-xhs-pink" : "bg-neutral-300"
          }`}
        />
        <span className="font-medium text-neutral-700">
          {streaming ? latest : "已完成"}
        </span>
        <span className="ml-auto text-xs text-neutral-400">
          {events.length} 事件
        </span>
      </div>
    </div>
  );
}
