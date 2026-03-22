const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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

async function rawRequest<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = options;
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
    const err: ApiError = {
      status: 0,
      message: `Cannot reach API at ${API_BASE_URL}. Make sure the backend is running and accessible.`,
      details: e
    };
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    if (payload && typeof payload === "object") {
      if ("detail" in payload && String((payload as any).detail)) {
        message = String((payload as any).detail);
      } else {
        const firstKey = Object.keys(payload)[0];
        const firstVal = (payload as any)[firstKey];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          message = `${firstKey}: ${firstVal[0]}`;
        } else if (typeof firstVal === "string") {
          message = `${firstKey}: ${firstVal}`;
        }
      }
    } else if (typeof payload === "string" && payload) {
      message = payload;
    }

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

