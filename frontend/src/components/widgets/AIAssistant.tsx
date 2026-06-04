import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SUGGESTIONS = [
  "What is LTV and why does it matter?",
  "How do I register a new property?",
  "What does the Liquidity Score mean?",
  "How to interpret a fraud risk score?",
  "How does an AI assessment work?",
  "What's a safe LTV for residential property?",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2.5 text-xs", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        isUser ? "bg-primary/20" : "bg-primary/10"
      )}>
        {isUser
          ? <User className="w-3 h-3 text-primary" />
          : <Bot className="w-3 h-3 text-primary" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border text-foreground"
      )}>
        {msg.content}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your CollateralOS assistant. I can help you understand assessments, LTV ratios, fraud alerts, liquidity scores, or how to use any part of the platform. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = async (text: string) => {
    const userText = text.trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreaming("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE}/api/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

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
              full += json.content;
              setStreaming(full);
            }
          } catch { }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: full }]);
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I ran into an issue. Please try again." },
        ]);
      }
    } finally {
      setLoading(false);
      setStreaming("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const hasOnlyWelcome = messages.length === 1;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
          open ? "bg-card border border-border text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"
        )}
        aria-label="Toggle AI assistant"
      >
        {open
          ? <ChevronDown className="w-5 h-5" />
          : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 sm:w-96 flex flex-col shadow-2xl rounded-xl border border-border bg-background overflow-hidden"
          style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-sidebar flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground">CollateralOS Assistant</div>
              <div className="text-[10px] text-muted-foreground">AI-powered platform guide</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {/* Streaming */}
            {loading && streaming && (
              <MessageBubble msg={{ role: "assistant", content: streaming }} />
            )}
            {loading && !streaming && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}

            {/* Suggestion chips — show only on fresh start */}
            {hasOnlyWelcome && !loading && (
              <div className="pt-1 space-y-1.5">
                <div className="text-[10px] text-muted-foreground px-0.5">Quick questions:</div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors bg-card"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-sidebar flex-shrink-0">
            <input
              ref={inputRef}
              className="flex-1 bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              placeholder="Ask anything about the platform…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
