"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";
import { generateQuiz, type QuizDetail } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/lib/route-guard";
import { getSessionJSON, setSessionJSON, StorageKeys } from "@/lib/storage";

type CategoryKey = "all" | "frontend" | "backend" | "system" | "devops" | "algorithms" | "database" | "design";

type BrowseCard = {
  id: string;
  category: Exclude<CategoryKey, "all">;
  label: string;
  title: string;
  description: string;
  topic: string;
  minutes: number;
  questions: number;
  difficulty: "easy" | "medium" | "hard";
  imageUrl: string;
};

function Icon({ name, className = "" }: { name: "clock" | "list" | "sliders"; className?: string }) {
  const c = ["h-4 w-4", className].join(" ");
  switch (name) {
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "list":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M9 6h12M9 12h12M9 18h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "sliders":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 6v0M16 12v0M12 18v0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function MyQuizzesPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const categories = React.useMemo(
    () =>
      [
        { key: "all" as const, label: "All Topics" },
        { key: "frontend" as const, label: "Frontend" },
        { key: "backend" as const, label: "Backend" },
        { key: "system" as const, label: "System Design" },
        { key: "devops" as const, label: "DevOps" },
        { key: "algorithms" as const, label: "Algorithms" },
        { key: "database" as const, label: "Database" },
        { key: "design" as const, label: "Design" }
      ] as const,
    []
  );

  const cards = React.useMemo<BrowseCard[]>(
    () => [
      {
        id: "react-fundamentals",
        category: "frontend",
        label: "FRONTEND",
        title: "React Fundamentals",
        description: "Master the basics of React, including components, state, props, and simple hooks…",
        topic: "React fundamentals",
        minutes: 15,
        questions: 20,
        difficulty: "easy",
        imageUrl: "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "js-deep-dive",
        category: "frontend",
        label: "FRONTEND",
        title: "JavaScript Deep Dive",
        description: "Explore advanced JS concepts: Event Loop, Prototypes, Closures, and Async patterns…",
        topic: "JavaScript advanced concepts",
        minutes: 25,
        questions: 15,
        difficulty: "hard",
        imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "system-design",
        category: "system",
        label: "SYSTEM DESIGN",
        title: "Advanced System Design",
        description: "Test your knowledge on scalable architectures, microservices, load balancing…",
        topic: "System design basics",
        minutes: 45,
        questions: 30,
        difficulty: "hard",
        imageUrl: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "docker-k8s",
        category: "devops",
        label: "DEVOPS",
        title: "Docker & Kubernetes Basics",
        description: "Learn the fundamentals of containerization, image building, and basic Kubernetes…",
        topic: "Docker and Kubernetes",
        minutes: 20,
        questions: 15,
        difficulty: "medium",
        imageUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "aws-cloud",
        category: "devops",
        label: "DEVOPS",
        title: "AWS Cloud Foundations",
        description: "Test your knowledge of core AWS services: EC2, S2, RDS, Lambda, and IAM basics…",
        topic: "AWS cloud foundations",
        minutes: 30,
        questions: 20,
        difficulty: "easy",
        imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "nodejs-micro",
        category: "backend",
        label: "BACKEND",
        title: "Node.js Microservices",
        description: "Building scalable backend services using Node.js, message queues, and clustering…",
        topic: "Node.js microservices architecture",
        minutes: 35,
        questions: 20,
        difficulty: "medium",
        imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "graphql-api",
        category: "backend",
        label: "BACKEND",
        title: "GraphQL API Design",
        description: "Master schemas, resolvers, mutations, and query optimization for modern APIs…",
        topic: "GraphQL schema design",
        minutes: 20,
        questions: 15,
        difficulty: "medium",
        imageUrl: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "python-dsa",
        category: "algorithms",
        label: "ALGORITHMS",
        title: "Python Data Structures",
        description: "Evaluate your understanding of Python's built-in data structures, algorithmic…",
        topic: "Python data structures",
        minutes: 30,
        questions: 25,
        difficulty: "medium",
        imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "ml-basics",
        category: "algorithms",
        label: "ALGORITHMS",
        title: "Machine Learning Basics",
        description: "Understand simple regressions, classification algorithms, and basic neural nets…",
        topic: "Machine learning fundamentals",
        minutes: 40,
        questions: 15,
        difficulty: "hard",
        imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "postgres",
        category: "database",
        label: "DATABASE",
        title: "PostgreSQL Mastery",
        description: "Dive deep into advanced querying, indexing strategies, performance tuning, and…",
        topic: "PostgreSQL basics",
        minutes: 40,
        questions: 25,
        difficulty: "hard",
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "ui-ux",
        category: "design",
        label: "DESIGN",
        title: "UI/UX Principles",
        description: "A quick quiz on core design principles, accessibility basics, and creating user…",
        topic: "UI UX principles",
        minutes: 15,
        questions: 15,
        difficulty: "easy",
        imageUrl: "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "redis-caching",
        category: "backend",
        label: "BACKEND",
        title: "Redis Caching Essentials",
        description: "Learn cache-aside patterns, TTL strategies, eviction policies, and scaling reads with Redis…",
        topic: "Redis caching essentials",
        minutes: 25,
        questions: 18,
        difficulty: "medium",
        imageUrl: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    []
  );

  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [customTopic, setCustomTopic] = React.useState("");
  const [customDifficulty, setCustomDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");
  const [customQuestionCount, setCustomQuestionCount] = React.useState<number>(10);
  const [customLoading, setCustomLoading] = React.useState(false);
  const [customError, setCustomError] = React.useState<string | null>(null);

  const filteredCards = React.useMemo(() => {
    if (activeCategory === "all") return cards;
    return cards.filter((c) => c.category === activeCategory);
  }, [activeCategory, cards]);

  const [last, setLast] = React.useState<{ quizId: number; score: number } | null>(null);

  React.useEffect(() => {
    setLast(getSessionJSON<{ quizId: number; score: number }>(StorageKeys.lastResults));
  }, []);

  async function startQuiz(card: BrowseCard) {
    setError(null);
    setLoadingId(card.id);
    try {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const quiz: QuizDetail = await generateQuiz(token, {
        topic: card.topic,
        number_of_questions: card.questions,
        difficulty: card.difficulty
      });

      setSessionJSON(StorageKeys.currentQuiz, quiz);
      router.push(`/quiz/take?quizId=${quiz.id}&time=${card.minutes}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate quiz");
    } finally {
      setLoadingId(null);
    }
  }

  async function startCustomQuiz(e: React.FormEvent) {
    e.preventDefault();
    setCustomError(null);

    const topic = customTopic.trim();
    if (!topic) {
      setCustomError("Please enter a topic.");
      return;
    }
    if (!Number.isFinite(customQuestionCount) || customQuestionCount < 5 || customQuestionCount > 20) {
      setCustomError("Question count must be between 5 and 20.");
      return;
    }

    setCustomLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const quiz: QuizDetail = await generateQuiz(token, {
        topic,
        number_of_questions: customQuestionCount,
        difficulty: customDifficulty
      });

      setSessionJSON(StorageKeys.currentQuiz, quiz);
      router.push(`/quiz/take?quizId=${quiz.id}&time=${quiz.time_limit_minutes}`);
    } catch (e: any) {
      setCustomError(e?.message ?? "Failed to generate custom quiz");
    } finally {
      setCustomLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[34px] font-semibold leading-tight text-slate-900">Browse Quizzes</h1>
        <p className="mt-1 text-sm text-slate-500">Discover new topics, test your knowledge, and level up your skills.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-900">Create Custom Quiz</div>
        <form onSubmit={startCustomQuiz} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Topic</span>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. React hooks, PostgreSQL indexing, AWS IAM"
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-200/50"
              maxLength={120}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Difficulty</span>
            <select
              value={customDifficulty}
              onChange={(e) => setCustomDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/50"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Questions (5-20)</span>
            <input
              type="number"
              min={5}
              max={20}
              value={customQuestionCount}
              onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/50"
            />
          </label>

          <Button
            type="submit"
            className="h-10 rounded-md bg-brand-600 px-5 hover:bg-brand-700"
            isLoading={customLoading}
            disabled={customLoading}
          >
            Generate Quiz
          </Button>
        </form>
        {customError ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{customError}</div> : null}
      </section>

      <div className="flex items-center justify-between gap-4">
        <div className="flex max-w-full flex-1 items-center gap-2 overflow-x-auto pb-1">
          {categories.map((c) => {
            const active = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={[
                  "whitespace-nowrap rounded-md border px-4 py-2 text-xs font-semibold transition",
                  active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                ].join(" ")}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <Button variant="secondary" className="h-9 shrink-0 rounded-md border-slate-200 px-3 text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Icon name="sliders" className="h-4 w-4" />
            Filters
          </span>
        </Button>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="text-2xl font-semibold text-slate-900">Trending This Week</div>
        <div className="text-xs text-slate-400">{filteredCards.length} total</div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredCards.map((card) => (
          <div key={card.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-40 overflow-hidden">
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute right-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                Featured
              </div>
            </div>
            <div className="p-4">
              <div className="text-[10px] font-bold tracking-wider text-brand-700">{card.label}</div>
              <div className="mt-1 text-xl font-semibold leading-tight text-slate-900">{card.title}</div>
              <div className="mt-2 line-clamp-2 text-sm text-slate-500">{card.description}</div>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" className="h-4 w-4" />
                  {card.minutes} mins
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="list" className="h-4 w-4" />
                  {card.questions} Qs
                </span>
              </div>

              <div className="mt-4">
                <Button
                  className="w-full rounded-md bg-brand-600 hover:bg-brand-700"
                  isLoading={loadingId === card.id}
                  onClick={() => startQuiz(card)}
                  disabled={loadingId != null}
                >
                  Start Quiz →
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!filteredCards.length ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          No quizzes found for this topic filter.
        </div>
      ) : null}

      {last ? (
        <div className="text-sm text-slate-500">
          Last score: <span className="font-semibold text-slate-900">{last.score}</span>
        </div>
      ) : null}
    </div>
  );
}
