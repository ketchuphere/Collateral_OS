import { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCw, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function parseSummary(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let status = "";
  const bullets: string[] = [];
  let actionLabel = "";
  let action = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!status && !line.startsWith("•") && !line.startsWith("-") && !line.toLowerCase().startsWith("recommended")) {
      status = line;
    } else if (line.startsWith("•") || line.startsWith("-")) {
      bullets.push(line.replace(/^[•\-]\s*/, ""));
    } else if (line.toLowerCase().startsWith("recommended action")) {
      const rest = line.replace(/recommended action[:\s]*/i, "").trim();
      actionLabel = "Recommended Action";
      action = rest || (lines[i + 1] ?? "");
    }
  }

  return { status, bullets, actionLabel, action };
}

const severityClass = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes("critical") || lower.includes("immediately")) return "text-red-400";
  if (lower.includes("increase") || lower.includes("flag") || lower.includes("risk") || lower.includes("review")) return "text-amber-400";
  return "text-foreground/80";
};

export default function AIPortfolioSummary() {
  const [raw, setRaw] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (loading) return;
    setRaw("");
    setDone(false);
    setError(false);
    setLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE}/api/ai-portfolio-summary`, {
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6));
            if (json.done) { setDone(true); break; }
            if (json.error) { setError(true); break; }
            if (json.content) setRaw((prev) => prev + json.content);
          } catch { }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") setError(true);
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  useEffect(() => {
    generate();
    return () => abortRef.current?.abort();
  }, []);

  const { status, bullets, actionLabel, action } = parseSummary(raw);
  const isStable = status.toLowerCase().includes("stable") || status.toLowerCase().includes("healthy");

  return (
    <div className="relative rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card overflow-hidden">
      {/* Animated top accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px]",
        loading
          ? "bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"
          : "bg-gradient-to-r from-primary/60 via-primary to-primary/60"
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10",
                loading && "animate-pulse"
              )}>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              {loading && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground tracking-tight">AI Portfolio Summary</div>
              <div className="text-[10px] text-muted-foreground">
                {loading ? "Analysing portfolio…" : done ? "Generated from live portfolio data" : ""}
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] text-muted-foreground border border-border hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            Regenerate
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-xs text-muted-foreground py-2">Failed to generate summary. Check your Groq API key.</div>
        ) : raw.length === 0 && loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3.5 bg-muted/60 rounded w-3/4" />
            <div className="h-2.5 bg-muted/40 rounded w-1/2 mt-3" />
            <div className="h-2.5 bg-muted/40 rounded w-2/3" />
            <div className="h-2.5 bg-muted/40 rounded w-3/5" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status headline */}
            {status && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  isStable ? "bg-emerald-400" : "bg-amber-400"
                )} />
                <p className="text-sm font-medium text-foreground">{status}</p>
                {loading && <span className="w-0.5 h-3.5 bg-primary animate-pulse rounded-full ml-0.5" />}
              </div>
            )}

            {/* Bullet points */}
            {bullets.length > 0 && (
              <ul className="space-y-1.5 pl-1">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className={severityClass(b)}>{b}</span>
                  </li>
                ))}
                {loading && !done && (
                  <li className="flex items-start gap-2 text-xs">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" />
                  </li>
                )}
              </ul>
            )}

            {/* Recommended action */}
            {action && (
              <div className="flex items-start gap-2.5 mt-1 pt-3 border-t border-border/60">
                <div className="w-5 h-5 rounded bg-amber-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-0.5">
                    {actionLabel || "Recommended Action"}
                  </div>
                  <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                    {action}
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
