export const StorageKeys = {
  currentQuiz: "qyzen_current_quiz",
  lastResults: "qyzen_last_results"
} as const;

export type StoredResults = {
  quizId: number;
  score: number;
  answers: Array<{ questionId: number; selectedOptionId: number }>;
};

export function setSessionJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function getSessionJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

