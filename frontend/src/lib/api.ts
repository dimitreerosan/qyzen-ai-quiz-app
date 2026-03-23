/**
 * On Vercel, browser `fetch` to Render often fails (CORS / opaque network errors). Builds set
 * NEXT_PUBLIC_API_PROXY; we call same-origin `/api/...` and next.config.js rewrites to Render.
 */
function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL;

  if (typeof window !== "undefined" && (window as any).DEBUG_API) {
    console.log("[API Configuration Debug]", {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      VITE_API_URL: process.env.VITE_API_URL,
      NEXT_PUBLIC_API_PROXY: process.env.NEXT_PUBLIC_API_PROXY,
      VERCEL: process.env.VERCEL,
      Resolved: apiUrl,
    });
  }

  if (process.env.NEXT_PUBLIC_API_PROXY === "1") {
    // When using the proxy, the base path is relative to the current domain.
    return "/api";
  }

  if (apiUrl) {
    return apiUrl.trim().replace(/\/$/, "");
  }

  // Fallback for local development
  return "http://127.0.0.1:8000/api";
}

const API_BASE_URL = getApiBaseUrl();

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function isTokenInvalid(details: unknown): boolean {
  if (!details || typeof details !== "object") return false;
  const d: any = details;
  // SimpleJWT uses: {"detail":"Given token not valid for any token type","code":"token_not_valid", ...}
  return d.code === "token_not_valid" || (typeof d.detail === "string" && d.detail.toLowerCase().includes("token not valid"));
}

/** Django returns HTML error pages when DEBUG=false; avoid showing raw markup in the UI. */
function looksLikeHtmlServerPage(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.includes("<!doctype") ||
    t.includes("<html") ||
    (t.includes("<title>") && t.includes("server error"))
  );
}

function messageFromFailedResponse(status: number, payload: unknown): string {
  if (payload && typeof payload === "object") {
    // 1. SimpleJWT or DRF "detail" field
    if ("detail" in payload && String((payload as any).detail)) {
      return String((payload as any).detail);
    }
    // 2. DRF non_field_errors
    if ("non_field_errors" in payload) {
      const nfe = (payload as any).non_field_errors;
      if (Array.isArray(nfe) && nfe.length > 0) return String(nfe[0]);
    }
    // 3. Specific field errors (e.g. "username": ["..."])
    const keys = Object.keys(payload);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstVal = (payload as any)[firstKey];
      if (Array.isArray(firstVal) && firstVal.length > 0) {
        return `${firstKey}: ${firstVal[0]}`;
      }
      if (typeof firstVal === "string") {
        return `${firstKey}: ${firstVal}`;
      }
    }
  }
  if (typeof payload === "string" && payload) {
    if (looksLikeHtmlServerPage(payload)) {
      if (status >= 500) {
        return "The server had a problem. Try again in a moment. If it keeps happening, check the API logs (e.g. Render dashboard).";
      }
      return `Request failed (${status}).`;
    }
    return payload;
  }
  return `Request failed (${status})`;
}

async function rawRequest<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const method = options.method || "GET";
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {})
      }
    });
  } catch (e) {
    const hint =
      process.env.NEXT_PUBLIC_API_PROXY === "1"
        ? " Check BACKEND_ORIGIN / Render logs if this persists."
        : " If the API is remote, CORS may block the browser—deploy the frontend on Vercel with the default proxy (NEXT_PUBLIC_API_PROXY).";
    const err: ApiError = {
      status: 0,
      message: `Cannot reach API at ${API_BASE_URL}. Make sure the backend is running and accessible.${hint}`,
      details: e
    };
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  const looksHtml = contentType.includes("text/html");
  const isJson = contentType.includes("application/json") && !looksHtml;
  const payload: unknown = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message = messageFromFailedResponse(res.status, payload);
    // Explicit console logging to help troubleshooting (Step 4 from user guide)
    console.warn(`[API Error] ${method} ${path} returned ${res.status}:`, {
      message,
      payload,
      status: res.status,
      target: `${API_BASE_URL}${path}`
    });
    const err: ApiError = { status: res.status, message, details: payload };
    throw err;
  }

  return payload as T;
}

export type RefreshResponse = { access: string };

// ---------- Types ----------
export type LoginResponse = { refresh: string; access: string };

export type RegisterResponse = { id: number; username: string; email: string };

export type QuizOption = { id: number; text: string; is_correct?: boolean };
export type QuizQuestion = { id: number; text: string; options: QuizOption[] };
export type QuizDetail = {
  id: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_minutes: number;
  created_at: string;
  questions: QuizQuestion[];
};

export type Attempt = {
  id: number;
  quiz: { id: number; topic: string; difficulty: "easy" | "medium" | "hard"; time_limit_minutes: number };
  score: number;
  completed_at: string;
};

export type AttemptDetail = {
  id: number;
  quiz: { id: number; topic: string; difficulty: "easy" | "medium" | "hard"; time_limit_minutes: number };
  score: number;
  completed_at: string;
  answers: Array<{ question_id: number; selected_option_id: number }>;
};

export type SubmitQuizResponse = { score: number };

export type User = { id: number; username: string; email: string };

// ---------- API ----------
export async function login(input: { username: string; password: string }): Promise<LoginResponse> {
  return rawRequest<LoginResponse>("/auth/login/", { method: "POST", body: JSON.stringify(input) });
}

export async function register(input: { username: string; password: string; email?: string }): Promise<RegisterResponse> {
  return rawRequest<RegisterResponse>("/auth/register/", { method: "POST", body: JSON.stringify({ ...input, email: input.email ?? "" }) });
}

export async function getCurrentUser(token: string): Promise<User> {
  return request<User>("/auth/me/", { method: "GET", token });
}

export async function refreshAccessToken(refresh: string): Promise<RefreshResponse> {
  return rawRequest<RefreshResponse>("/auth/refresh/", { method: "POST", body: JSON.stringify({ refresh }) });
}

async function request<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<T> {
  // 1) first try
  try {
    return await rawRequest<T>(path, options);
  } catch (e: any) {
    // 2) if token invalid, try refresh once and retry
    if (e?.status === 401 && isTokenInvalid(e?.details)) {
      const { getRefreshToken, setAccessToken, clearToken } = await import("@/lib/auth");
      const refresh = getRefreshToken();
      if (!refresh) {
        clearToken();
        throw e;
      }
      try {
        const refreshed = await refreshAccessToken(refresh);
        setAccessToken(refreshed.access);
        const retryToken = refreshed.access;
        return await rawRequest<T>(path, { ...options, token: retryToken });
      } catch {
        clearToken();
        throw e;
      }
    }
    throw e;
  }
}

export async function generateQuiz(
  token: string,
  input: { topic: string; number_of_questions: number; difficulty: "easy" | "medium" | "hard" }
): Promise<QuizDetail> {
  return request<QuizDetail>("/quiz/generate/", { method: "POST", token, body: JSON.stringify(input) });
}

export async function getQuiz(token: string, id: number): Promise<QuizDetail> {
  return request<QuizDetail>(`/quiz/${id}/`, { method: "GET", token });
}

export async function submitQuiz(
  token: string,
  input: { quiz_id: number; answers: Array<{ question_id: number; selected_option_id: number }> }
): Promise<SubmitQuizResponse> {
  return request<SubmitQuizResponse>("/quiz/submit/", { method: "POST", token, body: JSON.stringify(input) });
}

export async function getQuizHistory(token: string): Promise<Attempt[]> {
  return request<Attempt[]>("/quiz/history/", { method: "GET", token });
}

export async function getAttemptDetail(token: string, id: number): Promise<AttemptDetail> {
  return request<AttemptDetail>(`/quiz/attempt/${id}/`, { method: "GET", token });
}

