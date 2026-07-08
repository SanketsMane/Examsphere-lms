"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What courses do you offer?",
  "NEET course fees?",
  "How do I enroll?",
  "How can I contact you?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! 👋 I'm the **ExamSphere Assistant**. Ask me about our **JEE, NEET, Foundation & MBBS** courses, fees, admissions or contact info.",
};

export function PublicChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }), // drop the local welcome
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "Sorry, please try again." }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't reach the server. Please check your connection, or use the query form in the footer.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open ExamSphere assistant"}
        className="fixed bottom-5 right-5 z-[120] h-14 w-14 rounded-full bg-navy-900 hover:bg-navy-950 text-white shadow-[var(--shadow-es-lg)] flex items-center justify-center transition-all hover:-translate-y-0.5 lg:bottom-6 lg:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-500 ring-2 ring-background" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[120] flex flex-col overflow-hidden bg-card border border-border shadow-[var(--shadow-es-lg)]
                     inset-x-0 bottom-0 top-auto h-[85vh] rounded-t-2xl
                     sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-navy-950 to-navy-700 text-white shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-sm leading-tight">ExamSphere Assistant</div>
              <div className="text-[11px] text-white/70 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online — usually replies instantly
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-bg-soft dark:bg-muted/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-navy-900 text-white flex items-center justify-center mr-2 shrink-0 self-end">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-navy-900 text-white rounded-br-sm"
                      : "bg-card border border-border text-ink-900 dark:text-foreground rounded-bl-sm"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-full bg-navy-900 text-white flex items-center justify-center mr-2 shrink-0 self-end">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-ink-500" />
                </div>
              </div>
            )}

            {/* Suggestion chips (only before the user has asked anything) */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border text-ink-700 dark:text-muted-foreground hover:border-navy-900 hover:text-navy-900 dark:hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 p-3 border-t border-border bg-card shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses, fees, admissions…"
              className="flex-1 bg-bg-soft dark:bg-muted rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-navy-900/40 text-foreground"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="h-10 w-10 rounded-full bg-navy-900 hover:bg-navy-950 text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
