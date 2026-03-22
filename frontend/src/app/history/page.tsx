"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { generateQuiz, getQuiz, getQuizHistory, type Attempt } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/lib/route-guard";
import { setSessionJSON, StorageKeys } from "@/lib/storage";

type TabKey = "all" | "completed" | "in_progress";

function formatDate(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDuration(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "-";
  if (totalMinutes < 60) return `${totalMinutes} mins`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function scoreBadgeClasses(percent: number | null) {
  if (percent == null) return "bg-black/[0.03] text-black/70 border border-black/10";
  if (percent >= 85) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (percent >= 70) return "bg-orange-50 text-orange-700 border border-orange-200";
  return "bg-rose-50 text-rose-700 border border-rose-200";
}

function Icon({ name, className = "" }: { name: "check" | "target" | "clock" | "flame" | "filter"; className?: string }) {
  const c = ["h-4 w-4", className].join(" ");
  switch (name) {
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 16a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10v2l2 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "flame":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path
            d="M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-3 3-4 5-1-2-2-4-5-6 1 4-1 6-1 10 0 4 3 7 7 7z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "filter":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const [history, setHistory] = React.useState<Attempt[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [retakeLoadingId, setRetakeLoadingId] = React.useState<number | null>(null);

  const [tab, setTab] = React.useState<TabKey>("all");

  React.useEffect(() => {
    if (!ready) return;
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    getQuizHistory(token)
      .then((data) => setHistory(data))
      .catch((e: any) => setError(e?.message ?? "Failed to load history"))
      .finally(() => setLoading(false));
  }, [ready]);

  const attempts = React.useMemo(() => history ?? [], [history]);
  const totalQuizzes = attempts.length;
  const totalTimeSpentMinutes = attempts.reduce((sum, a) => sum + (a.quiz.time_limit_minutes ?? 0), 0);

  const maxScoreObserved = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
  const avgScoreRaw = attempts.length ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length : null;
  const avgScorePercent = avgScoreRaw != null && maxScoreObserved != null && maxScoreObserved > 0 ? Math.round((avgScoreRaw / maxScoreObserved) * 100) : null;

  const streakDisplay = React.useMemo(() => {
    if (!attempts.length) return "-";

    const dates = attempts.map((h) => new Date(h.completed_at).toLocaleDateString("en-CA"));
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();

    const todayStr = new Date().toLocaleDateString("en-CA");
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = yest.toLocaleDateString("en-CA");

    let streak = 0;
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let currentCheck = new Date(uniqueDates[0]);
      for (const dStr of uniqueDates) {
        if (dStr === currentCheck.toLocaleDateString("en-CA")) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return `${streak} day${streak === 1 ? "" : "s"}`;
  }, [attempts]);

  const filteredAttempts = React.useMemo(() => {
    if (tab === "all") return attempts;
    if (tab === "completed") return attempts;
    return [];
  }, [attempts, tab]);

  async function handleRetake(attempt: Attempt) {
    setError(null);
    setRetakeLoadingId(attempt.id);
    try {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const originalQuiz = await getQuiz(token, attempt.quiz.id);
      const originalCount = originalQuiz.questions.length;
      const numberOfQuestions = Math.min(20, Math.max(5, originalCount || 10));

      const newQuiz = await generateQuiz(token, {
        topic: attempt.quiz.topic,
        number_of_questions: numberOfQuestions,
        difficulty: attempt.quiz.difficulty
      });

      setSessionJSON(StorageKeys.currentQuiz, newQuiz);
      router.push(`/quiz/take?quizId=${newQuiz.id}&time=${newQuiz.time_limit_minutes}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to retake this quiz");
    } finally {
      setRetakeLoadingId(null);
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Quiz History &amp; Performance</h1>
        <div className="mt-1 text-sm text-black/50">
          Track your progress, review past answers, and see how you&apos;ve improved over time.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="check" />
            </div>
            <div>
              <div className="text-xs text-black/50">Total Quizzes</div>
              <div className="text-lg font-semibold text-ink-900">{totalQuizzes}</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="target" />
            </div>
            <div>
              <div className="text-xs text-black/50">Average Score</div>
              <div className="text-lg font-semibold text-ink-900">{avgScorePercent != null ? `${avgScorePercent}%` : "-"}</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="clock" />
            </div>
            <div>
              <div className="text-xs text-black/50">Time Spent</div>
              <div className="text-lg font-semibold text-ink-900">{formatDuration(totalTimeSpentMinutes)}</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="flame" />
            </div>
            <div>
              <div className="text-xs text-black/50">Current Streak</div>
              <div className="text-lg font-semibold text-ink-900">{streakDisplay}</div>
            </div>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="text-sm font-semibold text-ink-900">Quiz History</div>
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-black/[0.03]">
              <Icon name="filter" className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-black/10 bg-black/[0.02] p-1">
              <button
                onClick={() => setTab("all")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  tab === "all" ? "bg-white shadow-soft" : "text-black/60 hover:text-black/80"
                ].join(" ")}
              >
                All Quizzes
              </button>
              <button
                onClick={() => setTab("completed")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  tab === "completed" ? "bg-white shadow-soft" : "text-black/60 hover:text-black/80"
                ].join(" ")}
              >
                Completed
              </button>
              <button
                onClick={() => setTab("in_progress")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  tab === "in_progress" ? "bg-white shadow-soft" : "text-black/60 hover:text-black/80"
                ].join(" ")}
              >
                In Progress
              </button>
            </div>

            <div className="text-xs text-black/50">{totalQuizzes ? `${totalQuizzes} total` : ""}</div>
          </div>

          {loading ? <div className="mt-5 text-sm text-black/60">Loading…</div> : null}
          {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          {!loading && !error && tab === "in_progress" ? <div className="mt-5 text-sm text-black/60">No in-progress quizzes.</div> : null}
          {!loading && !error && tab !== "in_progress" && history && history.length === 0 ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No attempts yet. Start your first quiz from{" "}
              <Link href="/quiz" className="font-semibold text-brand-700 hover:text-brand-800">
                Browse Quizzes
              </Link>
              .
            </div>
          ) : null}

          {tab !== "in_progress" && filteredAttempts.length ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-black/10">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead className="bg-black/[0.02]">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-black/40">
                    <th className="w-[42%] px-3 py-3">Quiz Details</th>
                    <th className="w-[18%] px-3 py-3">Date Taken</th>
                    <th className="w-[14%] px-3 py-3">Score</th>
                    <th className="w-[14%] px-3 py-3">Time Taken</th>
                    <th className="w-[12%] px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((a) => {
                    const percent = maxScoreObserved && maxScoreObserved > 0 ? Math.round((a.score / maxScoreObserved) * 100) : null;
                    return (
                      <tr key={a.id} className="border-t border-black/10">
                        <td className="px-3 py-4">
                          <div className="text-sm font-semibold text-ink-900">{a.quiz.topic}</div>
                          <div className="mt-0.5 text-xs text-black/50">{a.quiz.difficulty} difficulty</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-black/70">{formatDate(a.completed_at)}</td>
                        <td className="px-3 py-4">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                              scoreBadgeClasses(percent)
                            ].join(" ")}
                          >
                            {percent != null ? `${percent}%` : a.score}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-black/60">{formatDuration(a.quiz.time_limit_minutes)}</td>
                        <td className="px-3 py-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-4 whitespace-nowrap">
                            <Link
                              href={`/results?attemptId=${a.id}`}
                              className="inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
                            >
                              Review →
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRetake(a)}
                              className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={retakeLoadingId != null}
                            >
                              {retakeLoadingId === a.id ? "Retaking..." : "Retake"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button variant="secondary" disabled>
              Load more
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
