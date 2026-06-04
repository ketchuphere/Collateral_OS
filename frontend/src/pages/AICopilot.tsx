import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, RotateCcw, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Suggested prompts ───────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: TrendingDown, text: "Which property has the highest fraud risk and why?" },
  { icon: AlertTriangle, text: "Are there any active alerts I should act on today?" },
  { icon: DollarSign, text: "What LTV should I approve for the pending loan applications?" },
  { icon: Sparkles, text: "Summarise the top 3 risk exposures in my portfolio" },
  { icon: Bot, text: "Which properties are suitable for immediate disbursement?" },
  { icon: TrendingDown, text: "Which collateral has the weakest liquidity and recovery profile?" },
];

// ─── Response renderer ───────────────────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) { elements.push(<div key={key++} className="h-1.5" />); continue; }

    // LTV / Risk verdict highlight lines
    if (/^(Suggested LTV:|Risk Verdict:)/i.test(line)) {
      const [label, ...rest] = line.split(":");
      elements.push(
        <div key={key++} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 my-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{label}</span>
          <span className="text-xs font-semibold text-foreground">{rest.join(":").trim()}</span>
        </div>
      );
      continue;
    }

    // Bold section headers like **Market Conditions:**
    if (/^\*\*.+\*\*/.test(line)) {
      const cleaned = line.replace(/\*\*/g, "");
      elements.push(
        <div key={key++} className="text-xs font-semibold text-foreground mt-2 mb-0.5">{cleaned}</div>
      );
      continue;
    }

    // Bullet points
    if (/^[•\-]\s/.test(line)) {
      const text = line.replace(/^[•\-]\s*/, "");
      // inline bold inside bullet
      const parts = text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith("**") ? <strong key={i} className="font-semibold text-foreground">{p.replace(/\*\*/g, "")}</strong> : p
      );
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
          <span className="text-primary mt-0.5 flex-shrink-0 text-sm leading-none">•</span>
          <span>{parts}</span>
        </div>
      );
      continue;
    }

    // Inline bold in regular text
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") ? <strong key={i} className="font-semibold text-foreground">{p.replace(/\*\*/g, "")}</strong> : p
    );
    elements.push(<p key={key++} className="text-xs text-foreground/80 leading-relaxed">{parts}</p>);
  }

  return elements;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "", streaming: true }]);
    setInput("");
    setLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE}/api/ai-copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6));
            if (json.done) break;
            if (json.content) {
              accumulated += json.content;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: accumulated, streaming: true };
                return next;
              });
            }
          } catch { }
        }
      }

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: accumulated, streaming: false };
        return next;
      });
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "Sorry, I encountered an error. Please try again.", streaming: false };
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI Underwriting Copilot</div>
            <div className="text-[10px] text-muted-foreground">Live portfolio context · Groq llama-3.3-70b</div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New Session
          </button>
        )}
      </div>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 space-y-8">
            {/* Hero */}
            <div className="text-center space-y-2 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="text-base font-semibold text-foreground">Ask anything about your portfolio</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                I have live access to your properties, assessments, alerts, and loan applications. Ask me for risk analysis, LTV recommendations, or fraud investigation.
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s.text)}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-colors group"
                >
                  <s.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary mt-0.5 flex-shrink-0 transition-colors" />
                  <span className="text-xs text-foreground/70 group-hover:text-foreground leading-snug transition-colors">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10"
                )}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5" />
                    : <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>

                {/* Bubble */}
                <div className={cn(
                  "rounded-xl px-4 py-3 max-w-[75%] space-y-1",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}>
                  {msg.role === "user" ? (
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                  ) : msg.content ? (
                    <div className="space-y-0.5">
                      {renderContent(msg.content)}
                      {msg.streaming && (
                        <span className="inline-block w-0.5 h-3 bg-primary animate-pulse rounded-full ml-0.5" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2 bg-card border border-border rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about a property, loan, risk signal, or underwriting decision…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed max-h-28 py-1 disabled:opacity-60"
            style={{ minHeight: "1.5rem" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground/50 text-center mt-1.5">Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}
