"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, Sparkles, User, Mail, Phone, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const LS_KEY = "examsphere_inquiry_id";

const SUGGESTIONS = [
  "What courses do you offer?",
  "Tell me about NEET",
  "How do I enroll?",
  "How can I contact you?",
];

function welcome(name?: string): Msg {
  const hi = name ? `Hi ${name.split(" ")[0]}! 👋` : "Hi! 👋";
  return {
    role: "assistant",
    content: `${hi} I'm the **ExamSphere Assistant**. Ask me about our **JEE, NEET, Foundation & MBBS** courses, admissions or contact info — and our team will reach out with fees & batch details.`,
  };
}

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isPhone = (p: string) => p.replace(/[^\d]/g, "").length >= 7;

export function PublicChatbot() {
  const [open, setOpen] = useState(false);

  // Lead gate
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "" });
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Msg[]>([welcome()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore an existing lead so returning visitors skip the form.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setInquiryId(saved);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Allow other components (e.g. the "Enquire Now" course buttons) to open the chat.
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("examsphere:open-chat", openChat);
    return () => window.removeEventListener("examsphere:open-chat", openChat);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inquiryId) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, inquiryId]);

  async function submitGate(e: React.FormEvent) {
    e.preventDefault();
    setGateError(null);
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!name || !email || !phone) return setGateError("Please fill in all fields.");
    if (!isEmail(email)) return setGateError("Please enter a valid email address.");
    if (!isPhone(phone)) return setGateError("Please enter a valid mobile number.");

    setGateLoading(true);
    try {
      const res = await fetch("/api/public/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, website: form.website }),
      });
      const data = await res.json();
      if (!res.ok || !data.inquiryId) {
        setGateError(data.error || "Couldn't start the chat. Please try again.");
        return;
      }
      try {
        localStorage.setItem(LS_KEY, data.inquiryId);
      } catch {
        /* ignore */
      }
      setInquiryId(data.inquiryId);
      setMessages([welcome(name)]);
    } catch {
      setGateError("Network error. Please check your connection and try again.");
    } finally {
      setGateLoading(false);
    }
  }

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
        body: JSON.stringify({ messages: next.slice(1), inquiryId }), // drop the local welcome
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

          {/* Gate: collect contact details before chatting */}
          {hydrated && !inquiryId ? (
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-bg-soft dark:bg-muted/20">
              <div className="h-12 w-12 rounded-full bg-navy-900 text-white flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-navy-950 dark:text-white">
                Let&apos;s get you started
              </h3>
              <p className="text-sm text-ink-600 dark:text-muted-foreground mt-1 mb-5">
                Share a few details so our counsellors can follow up, then ask me anything about ExamSphere.
              </p>

              <form onSubmit={submitGate} className="space-y-3">
                {/* Honeypot (hidden from users) */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="hidden"
                  aria-hidden="true"
                />

                <GateField
                  icon={<User className="h-4 w-4" />}
                  placeholder="Full name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  autoFocus
                />
                <GateField
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />
                <GateField
                  icon={<Phone className="h-4 w-4" />}
                  type="tel"
                  placeholder="Mobile number"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                />

                {gateError && <p className="text-xs text-red-600 dark:text-red-400">{gateError}</p>}

                <button
                  type="submit"
                  disabled={gateLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 hover:bg-navy-950 text-white font-semibold text-sm py-3 transition-colors disabled:opacity-60"
                >
                  {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Start chatting
                </button>

                <p className="flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-muted-foreground/80 pt-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> We&apos;ll only use this to help with your enquiry.
                </p>
              </form>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </>
  );
}

function GateField({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-navy-900/40">
      <span className="text-ink-400 dark:text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-ink-400 dark:placeholder:text-muted-foreground"
      />
    </div>
  );
}
