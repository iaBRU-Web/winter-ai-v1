export const BACKEND_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || "";

if (!BACKEND_URL && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_BACKEND_URL is not set. Set it in your Vercel project's Environment " +
    "Variables (or in a local .env file) to your Render backend URL, e.g. " +
    "https://winter-ai-backend.onrender.com/api/v1",
  );
}

export interface ReasoningStep {
  engine: string;
  status: string;
  output: string;
  duration_ms: number;
}

export interface ChatResponse {
  chat_id: string;
  lang: string;
  reasoning_steps: ReasoningStep[];
  final_answer: string;
  knowledge_source: string;
}

export interface HealthResponse {
  status: string;
  version?: string;
  knowledge_files?: string[];
  brain_size?: number;
  indexed_documents?: number;
}

async function jfetch<T>(path: string, init?: RequestInit, timeoutMs = 10000): Promise<T> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL not configured. Set VITE_BACKEND_URL to your Render backend URL.");
  }
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Is the Winter AI backend running?");
    }
    if (error instanceof Error) throw error;
    throw new Error("Backend request failed");
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  health: () => jfetch<HealthResponse>("/health", { method: "GET" }),
  listKnowledge: () => jfetch<unknown>("/knowledge/list"),
  getKnowledgeFile: (name: string) => jfetch<{ name: string; content: string }>(`/knowledge/${encodeURIComponent(name)}`),
  getBrain: () => jfetch<{ content: string }>("/brain"),
  updateBrain: (content: string) =>
    jfetch<{ status: string }>("/brain/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
  uploadKnowledge: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return jfetch<{ status: string; filename?: string }>("/knowledge/upload", {
      method: "POST",
      body: fd,
    });
  },
  chat: (prompt: string, chat_id: string, lang: "en" | "fr" | "rw") =>
    jfetch<ChatResponse>("/chats/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, chat_id, lang }),
    }),
  reason: (prompt: string, lang: "en" | "fr" | "rw" = "en") =>
    jfetch<{ decision: any; top_matches: any[] }>("/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, lang }),
    }),
};
