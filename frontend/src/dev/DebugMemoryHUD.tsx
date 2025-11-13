import React, { useMemo, useState } from "react";

type MemoryTrace = {
  mode: "off" | "write_only" | "read_only" | "read_write";
  used: boolean;
  cached?: boolean;
  took_ms?: number;
  source?: string;
  client_ids?: { user?: string; assistant?: string };
};

type Props = {
  lastTrace?: MemoryTrace | null;
  correlationId?: string | null;
};

export default function DebugMemoryHUD({ lastTrace, correlationId }: Props) {
  const [open, setOpen] = useState(true);
  const data = useMemo(() => lastTrace ?? null, [lastTrace]);

  // Calculate severity before conditional return (hooks must be called unconditionally)
  const severity = useMemo(() => {
    if (data?.source === "timeout" || data?.mode === "off") return "critical" as const;
    if (data?.mode === "write_only") return "warning" as const;
    return "ok" as const;
  }, [data]);

  if (!data) return null;

  const badgeClass =
    severity === "critical"
      ? "bg-red-600 text-white"
      : severity === "warning"
      ? "bg-amber-500 text-black"
      : "bg-emerald-600 text-white";

  const payload = {
    mode: String(data.mode),
    used: Boolean(data.used),
    cached: Boolean(data.cached),
    took_ms: data.took_ms ?? null,
    source: data.source ?? null,
    client_ids: data.client_ids ?? {},
    correlation: correlationId ?? null,
  };

  const copy = async () => {
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  return (
    <div
      data-testid="debug-memory-hud"
      className="fixed bottom-4 right-4 z-50 w-[340px] rounded-xl border border-gray-700 bg-neutral-900/90 p-3 shadow-xl backdrop-blur text-xs font-mono"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`px-2 py-1 rounded ${badgeClass}`}>
          {severity === "critical" ? "timeout/off" : severity === "warning" ? "write-only" : "read-write"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="rounded-md border border-gray-600 px-2 py-1 hover:bg-gray-700 text-gray-100"
          >
            Copy JSON
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md border border-gray-600 px-2 py-1 hover:bg-gray-700 text-gray-100"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {!open ? null : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-200">
          <KV k="mode" v={String(payload.mode)} testId="debug-memory-hud-mode" />
          <KV k="used" v={String(payload.used)} testId="debug-memory-hud-used" />
          <KV k="cached" v={String(payload.cached)} testId="debug-memory-hud-cached" />
          <KV k="took_ms" v={payload.took_ms != null ? `${payload.took_ms} ms` : "— ms"} testId="debug-memory-hud-took" />
          <KV k="source" v={String(payload.source ?? "-")} testId="debug-memory-hud-source" />
          <KV k="client_ids.user" v={String((payload.client_ids as any)?.user ?? "-")} />
          <KV k="client_ids.assistant" v={String((payload.client_ids as any)?.assistant ?? "-")} />
          <KV k="correlation" v={String(payload.correlation ?? "-")} />
        </div>
      )}
    </div>
  );
}

function KV({ k, v, testId }: { k: string; v: string; testId?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{k}</span>
      <span className="text-gray-900" data-testid={testId}>{v}</span>
    </div>
  );
}
