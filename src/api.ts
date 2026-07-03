export const BACKEND_URL: string =
  (import.meta as any).env?.VITE_BACKEND_URL || "https://backend-winter.onrender.com/api/v1";

export interface ReasoningStep {
  engine: string;
  status: string;
  output: string;
  duration_ms: number;
  [extra: string]: unknown; // each engine attaches extra fields (intent, best_match, etc.)
}

export interface ChatResponse {
  chat_id: string;
  lang: string;
  reasoning_steps: ReasoningStep[];
  final_answer: string;
  knowledge_source: string;
  output_valid: boolean;
}

export interface HealthResponse {
  status: string;
  version?: string;
  engines?: string[];
  indexed_documents?: number;
  knowledge_files?: string[];
  teach_files?: string[];
}

async function jfetch<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.detail ? `: ${body.detail}` : "";
      } catch {
        /* ignore non-JSON error bodies */
      }
      throw new Error(`${res.status} ${res.statusText}${detail}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Request timed out. If the backend is on Render's free tier it may be waking up from sleep -- try again in a few seconds.",
      );
    }
    if (error instanceof Error) throw error;
    throw new Error("Backend request failed");
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  health: () => jfetch<HealthResponse>("/health", { method: "GET" }),

  getBrain: () => jfetch<{ content: string; size: number }>("/brain"),
  updateBrain: (content: string) =>
    jfetch<{ status: string; size: number; documents: number }>("/brain/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),

  // api/inf/teach/ -- see the backend README for details
  teachList: () => jfetch<{ teach_dir: string; files: Record<string, number> }>("/teach/list"),
  teachUpload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return jfetch<{ status: string; filename: string; documents: number }>("/teach/upload", {
      method: "POST",
      body: fd,
    });
  },
  teachReload: () =>
    jfetch<{ status: string; files: Record<string, number>; documents: number }>("/teach/reload", {
      method: "POST",
    }),

  chat: (prompt: string, chat_id: string, lang: "en" | "fr" | "rw") =>
    jfetch<ChatResponse>("/chats/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, chat_id, lang }),
    }),

  reason: (prompt: string, lang: "en" | "fr" | "rw" = "en") =>
    jfetch<{ trace: ReasoningStep[]; answer: string }>("/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, lang }),
    }),
};
