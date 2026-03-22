"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { getAttemptDetail, getQuiz, getQuizHistory, type QuizDetail } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/lib/route-guard";
import { getSessionJSON, StorageKeys, type StoredResults } from "@/lib/storage";

function getCorrectOptionId(question: QuizDetail["questions"][number]): number | null {
  const opt = question.options.find((o) => o.is_correct);
  return opt?.id ?? null;
}

export default function ResultsPage() {
  const params = useSearchParams();
  const { ready } = useRequireAuth();

  const requestedQuizId = Number(params.get("quizId") ?? "");
  const requestedScore = Number(params.get("score") ?? "");
  const requestedAttemptId = Number(params.get("attemptId") ?? "");

  const [quiz, setQuiz] = React.useState<QuizDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resolvedQuizId, setResolvedQuizId] = React.useState<number | null>(null);
  const [resolvedScore, setResolvedScore] = React.useState<number | null>(null);
  const [selectedByQuestion, setSelectedByQuestion] = React.useState<Record<number, number>>({});

  const results = React.useMemo(
    () => getSessionJSON<StoredResults>(StorageKeys.lastResults),
    []
  );

  React.useEffect(() => {
    if (!ready) return;
    const token = getToken();
    if (!token) return;

    const hasRequestedAttempt = Number.isFinite(requestedAttemptId) && requestedAttemptId > 0;
    if (hasRequestedAttempt) {
      setLoading(true);
      setError(null);
      getAttemptDetail(token, requestedAttemptId)
        .then((attempt) => {
          setResolvedQuizId(attempt.quiz.id);
          setResolvedScore(attempt.score);
          const answerMap: Record<number, number> = {};
          for (const answer of attempt.answers) {
            answerMap[answer.question_id] = answer.selected_option_id;
          }
          setSelectedByQuestion(answerMap);
        })
        .catch((e: any) => setError(e?.message ?? "Failed to load attempt review"))
        .finally(() => setLoading(false));
      return;
    }

    const hasRequestedQuiz = Number.isFinite(requestedQuizId) && requestedQuizId > 0;
    if (hasRequestedQuiz) {
      setResolvedQuizId(requestedQuizId);

      if (results?.quizId === requestedQuizId) {
        setResolvedScore(results.score);
      } else if (Number.isFinite(requestedScore)) {
        setResolvedScore(requestedScore);
      } else {
        setResolvedScore(null);
      }
      if (results?.quizId === requestedQuizId) {
        const answerMap: Record<number, number> = {};
        for (const answer of results.answers) {
          answerMap[answer.questionId] = answer.selectedOptionId;
        }
        setSelectedByQuestion(answerMap);
      } else {
        setSelectedByQuestion({});
      }
      return;
    }

    // If results page is opened directly, fallback to latest history attempt.
    setLoading(true);
    setError(null);
    getQuizHistory(token)
      .then((history) => {
        if (!history.length) {
          setResolvedQuizId(null);
          setResolvedScore(null);
          setSelectedByQuestion({});
          return;
        }
        const latest = [...history].sort(
          (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0];
        return getAttemptDetail(token, latest.id);
      })
      .then((attempt) => {
        if (!attempt) return;
        setResolvedQuizId(attempt.quiz.id);
        setResolvedScore(attempt.score);
        const answerMap: Record<number, number> = {};
        for (const answer of attempt.answers) {
          answerMap[answer.question_id] = answer.selected_option_id;
        }
        setSelectedByQuestion(answerMap);
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load latest result"))
      .finally(() => setLoading(false));
  }, [ready, requestedAttemptId, requestedQuizId, requestedScore, results]);

  React.useEffect(() => {
    if (!ready) return;
    if (!resolvedQuizId) return;
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    getQuiz(token, resolvedQuizId)
      .then((q) => setQuiz(q))
      .catch((e: any) => setError(e?.message ?? "Failed to load quiz"))
      .finally(() => setLoading(false));
  }, [ready, resolvedQuizId]);

  if (!ready) return null;
  const score = resolvedScore;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-black/60">Results</div>
          <h1 className="text-xl font-semibold text-ink-900">Your score</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-black/60">Quiz ID</div>
            <div className="text-base font-semibold text-ink-900">{resolvedQuizId ?? "-"}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-black/60">Score</div>
            <div className="text-3xl font-semibold text-ink-900">{score != null ? score : "-"}</div>
          </div>
        </div>

        <div className="mt-6 border-t border-black/10 pt-6">
          <div className="mb-3 text-base font-semibold text-ink-900">Correct vs wrong</div>
          <div className="text-sm text-black/60">
            This view uses the quiz detail to show correctness. (If your backend doesn’t expose `is_correct` on options, this section can’t work.)
          </div>

          {loading ? <div className="mt-4 text-sm text-black/60">Loading breakdown...</div> : null}
          {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          {!loading && quiz ? (
            <div className="mt-4 space-y-4">
              {quiz.questions.map((q, idx) => {
                const selected = selectedByQuestion[q.id] ?? null;
                const correct = getCorrectOptionId(q);
                const correctText = q.options.find((o) => o.id === correct)?.text ?? null;
                const selectedText = q.options.find((o) => o.id === selected)?.text ?? null;
                const isCorrect = selected != null && correct != null && selected === correct;

                return (
                  <div key={q.id} className="rounded-2xl border border-black/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-medium text-ink-900">
                        {idx + 1}. {q.text}
                      </div>
                      <div
                        className={[
                          "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                          isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        ].join(" ")}
                      >
                        {isCorrect ? "Correct" : "Wrong"}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-black/[0.03] px-3 py-2">
                        <div className="text-xs uppercase tracking-wide text-black/50">Your answer</div>
                        <div className="text-sm font-medium text-ink-900">{selectedText ?? "Not answered"}</div>
                      </div>
                      <div className="rounded-xl bg-black/[0.03] px-3 py-2">
                        <div className="text-xs uppercase tracking-wide text-black/50">Correct answer</div>
                        <div className="text-sm font-medium text-ink-900">{correctText ?? "Unavailable"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 text-sm text-black/60">
              Take a quiz and submit it to see the full breakdown.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

