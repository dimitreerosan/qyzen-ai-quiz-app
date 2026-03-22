"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { getQuiz, submitQuiz, type QuizDetail } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/lib/route-guard";
import { getSessionJSON, setSessionJSON, StorageKeys, type StoredResults } from "@/lib/storage";

type AnswerState = Record<number, number | null>; // questionId -> optionId

function getCorrectOptionId(question: QuizDetail["questions"][number]): number | null {
  const opt = question.options.find((o) => o.is_correct);
  return opt?.id ?? null;
}

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready } = useRequireAuth();

  const [quizId, setQuizId] = React.useState<number | null>(null);
  const [timeParam, setTimeParam] = React.useState<number>(0);

  const [quiz, setQuiz] = React.useState<QuizDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<AnswerState>({});
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const [isTimedOut, setIsTimedOut] = React.useState(false);
  const onSubmitRef = React.useRef<() => void>(() => { });

  React.useEffect(() => {
    setQuizId(Number(searchParams.get("quizId") ?? ""));
    setTimeParam(Number(searchParams.get("time") ?? "0"));
  }, [searchParams]);



  React.useEffect(() => {
    if (!ready || quizId === null) return;
    if (!Number.isFinite(quizId) || quizId <= 0) {
      setError("Missing quizId. Generate a quiz from the My Quizzes page.");
      return;
    }

    const cached = getSessionJSON<QuizDetail>(StorageKeys.currentQuiz);
    if (cached?.id === quizId) {
      setQuiz(cached);
      const initial: AnswerState = {};
      for (const q of cached.questions) initial[q.id] = null;
      setAnswers(initial);
      const initialSeconds = cached.time_limit_minutes ? cached.time_limit_minutes * 60 : timeParam > 0 ? timeParam * 60 : cached.questions.length * 60;
      setTimeLeft(initialSeconds);
      return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    getQuiz(token, quizId)
      .then((q) => {
        setQuiz(q);
        setSessionJSON(StorageKeys.currentQuiz, q);
        const initial: AnswerState = {};
        for (const qq of q.questions) initial[qq.id] = null;
        setAnswers(initial);
        const initialSeconds = q.time_limit_minutes ? q.time_limit_minutes * 60 : timeParam > 0 ? timeParam * 60 : q.questions.length * 60;
        setTimeLeft(initialSeconds);
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load quiz"))
      .finally(() => setLoading(false));
  }, [ready, quizId, timeParam]);

  React.useEffect(() => {
    if (!quiz || submitLoading || isTimedOut) return;
    if (timeLeft <= 0) {
      setIsTimedOut(true);
      onSubmitRef.current();
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [quiz, timeLeft, submitLoading, isTimedOut]);

  const onSubmit = React.useCallback(async () => {
    if (!quiz) return;
    setError(null);
    setSubmitLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const payloadAnswers = quiz.questions
        .map((qq) => ({
          question_id: qq.id,
          selected_option_id: answers[qq.id]
        }))
        .filter((a): a is { question_id: number; selected_option_id: number } => typeof a.selected_option_id === "number");

      const res = await submitQuiz(token, { quiz_id: quiz.id, answers: payloadAnswers });

      const results: StoredResults = {
        quizId: quiz.id,
        score: res.score,
        answers: payloadAnswers.map((a) => ({ questionId: a.question_id, selectedOptionId: a.selected_option_id }))
      };
      setSessionJSON(StorageKeys.lastResults, results);
      router.push(`/results?quizId=${quiz.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit quiz");
    } finally {
      setSubmitLoading(false);
    }
  }, [quiz, answers, router]);

  React.useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  if (!ready) return null;
  if (loading) return <div className="text-sm text-black/60">Loading quiz…</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!quiz) return <div className="text-sm text-black/60">No quiz loaded.</div>;

  const q = quiz.questions[index];
  const total = quiz.questions.length;

  const selected = answers[q.id] ?? null;
  const answeredCount = Object.values(answers).filter((v) => v != null).length;

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const timerStatusClass = timeLeft > 60 ? "text-ink-900" : "text-rose-500";

  function onExitQuiz() {
    const ok = window.confirm("Exit quiz? Your current progress will be lost.");
    if (!ok) return;
    router.push("/quiz");
  }


  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <main className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-black/60">Quiz</div>
              <h1 className="text-2xl font-semibold text-ink-900">{quiz.topic}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-black/60">{answeredCount}/{total} answered</div>
              <div className="text-sm font-semibold" aria-live="polite">
                Time left <span className={timerStatusClass}>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-black/60">
                Question {index + 1} of {total}
              </div>
              <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink-900">{quiz.difficulty}</div>
            </div>

            <div className="text-xl sm:text-2xl font-semibold text-ink-900 leading-snug">{q.text}</div>

            <div className="mt-4 space-y-3">
              {q.options.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition",
                      isSelected ? "border-ink-900/30 bg-black/[0.02]" : "border-black/10 bg-white hover:bg-black/[0.02]"
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={isSelected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className="mt-1"
                    />
                    <div className="text-sm text-ink-900">{opt.text}</div>
                  </label>
                );
              })}
            </div>

            {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                  Back
                </Button>
                {index < total - 1 ? (
                  <Button variant="primary" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} disabled={selected == null}>
                    Next
                  </Button>
                ) : null}
              </div>

              {index === total - 1 ? (
                <Button onClick={onSubmit} isLoading={submitLoading} disabled={answeredCount === 0 || submitLoading}>
                  Submit Quiz
                </Button>
              ) : (
                <div className="text-sm text-black/60">
                  Tip: answer to unlock <span className="font-medium text-ink-900">Next</span>
                </div>
              )}
            </div>

            {/* correctness is used on Results; kept here to ensure types line up */}
            <div className="sr-only">{getCorrectOptionId(q) ?? ""}</div>
          </div>
        </main>

        <aside className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft lg:col-span-1 lg:sticky lg:top-20">
          <h2 className="text-sm font-semibold text-ink-900">Quiz navigation</h2>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {quiz.questions.map((question, i) => {
              const isAnswered = answers[question.id] != null;
              const isActive = i === index;
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={[
                    "aspect-square w-full rounded-md text-xs font-semibold transition",
                    isActive ? "bg-emerald-600 text-white" : isAnswered ? "bg-emerald-100 text-emerald-700" : "bg-black/5 text-black/70",
                    "hover:brightness-95"
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-black/60">Show one page at a time</div>
          <Button className="mt-4 w-full" onClick={onSubmit} isLoading={submitLoading} disabled={answeredCount === 0 || submitLoading}>
            Submit
          </Button>
        </aside>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="text-sm text-black/60">Loading quiz…</div>}>
      <QuizPageContent />
    </Suspense>
  );
}

