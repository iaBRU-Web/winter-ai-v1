import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ChatResponse, type ReasoningStep } from "./api";

type Lang = "en" | "fr" | "rw";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  reasoning?: ReasoningStep[];
  source?: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function createChat(): Chat {
  return { id: uid("chat_"), title: "New chat", messages: [] };
}

const LANG_LABEL: Record<Lang, string> = { en: "English", fr: "Français", rw: "Kinyarwanda" };

export default function App() {
  const [chats, setChats] = useState<Chat[]>([createChat()]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [sending, setSending] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0];

  useEffect(() => {
    api.health().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeChat?.messages.length]);

  const updateActiveChat = useCallback(
    (updater: (chat: Chat) => Chat) => {
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? updater(c) : c)));
    },
    [activeChatId],
  );

  const newChat = () => {
    const c = createChat();
    setChats((prev) => [c, ...prev]);
    setActiveChatId(c.id);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { id: uid("u_"), role: "user", content: trimmed };
    const assistantId = uid("a_");
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "Thinking…", pending: true };

    updateActiveChat((c) => ({
      ...c,
      title: c.messages.length === 0 ? trimmed.slice(0, 48) : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    }));

    try {
      const res: ChatResponse = await api.chat(trimmed, activeChat.id, lang);
      updateActiveChat((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: res.final_answer,
                pending: false,
                reasoning: res.reasoning_steps,
                source: res.knowledge_source,
              }
            : m,
        ),
      }));
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      const message = err instanceof Error ? err.message : "Could not reach Winter AI.";
      updateActiveChat((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId ? { ...m, content: message, pending: false, error: true } : m,
        ),
      }));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new-chat-btn" onClick={newChat}>+ New chat</button>
        <div className="chat-list">
          {chats.map((c) => (
            <button
              key={c.id}
              className={`chat-list-item ${c.id === activeChatId ? "active" : ""}`}
              onClick={() => setActiveChatId(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <span className={`status-dot ${backendOnline ? "online" : backendOnline === false ? "offline" : ""}`} />
          {backendOnline === null ? "Checking backend…" : backendOnline ? "Backend online" : "Backend offline"}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1>❄️ Winter AI</h1>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            {(["en", "fr", "rw"] as Lang[]).map((l) => (
              <option key={l} value={l}>{LANG_LABEL[l]}</option>
            ))}
          </select>
        </header>

        <div className="messages" ref={scrollRef}>
          {activeChat.messages.length === 0 && (
            <div className="empty-state">
              <p>Ask Winter AI something — try "hello", "amakuru", or "how do you work".</p>
            </div>
          )}
          {activeChat.messages.map((m) => (
            <div key={m.id} className={`message ${m.role} ${m.error ? "error" : ""}`}>
              <div className="bubble">
                {m.content}
                {m.reasoning && (
                  <div className="reasoning">
                    <button
                      className="reasoning-toggle"
                      onClick={() => setShowReasoning((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    >
                      {showReasoning[m.id] ? "Hide reasoning ▲" : "Show reasoning ▼"}
                    </button>
                    {showReasoning[m.id] && (
                      <ul className="reasoning-steps">
                        {m.reasoning.map((step, i) => (
                          <li key={i}>
                            <strong>{step.engine}</strong> [{step.status}] — {step.output}
                            <span className="ms"> ({step.duration_ms}ms)</span>
                          </li>
                        ))}
                        {m.source && <li className="source">source: {m.source}</li>}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="composer">
          <textarea
            placeholder="Message Winter AI…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button onClick={send} disabled={sending || !input.trim()}>Send</button>
        </div>
      </main>
    </div>
  );
}
