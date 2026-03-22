"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { clearToken, getToken } from "@/lib/auth";

function Icon({ name, className = "" }: { name: "logo" | "book" | "chart" | "clock" | "logout"; className?: string }) {
  const c = ["h-4 w-4", className].join(" ");
  switch (name) {
    case "logo":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={["h-5 w-5", className].join(" ")} aria-hidden="true">
          {/* Main Q Circle */}
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          {/* Q Tail */}
          <path d="M18 18l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* Lightning Bolt inside */}
          <path
            d="M13 7l-4 5h3l-1 5 4-5h-3l1-5z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M7 5h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M5 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M14 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M21 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function Item({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href === "/quiz" && pathname.startsWith("/quiz"));
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        active ? "bg-brand-100 text-brand-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      ].join(" ")}
    >
      <span className={active ? "text-brand-600" : "text-slate-400"}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToken(getToken());
  }, []);

  return (
    <aside className="flex h-full min-h-[calc(100dvh-2rem)] flex-col">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <Icon name="logo" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-semibold text-slate-900">Qyzen</div>
        </div>
      </div>

      <div className="mt-6 px-2 text-[11px] font-semibold tracking-wider text-slate-400">MAIN MENU</div>
      <div className="mt-2 space-y-1">
        <Item href="/quiz" label="Browse Quizzes" icon={<Icon name="book" />} />
        <Item href="/history" label="Quiz History" icon={<Icon name="clock" />} />
        <Item href="/results" label="Analytics" icon={<Icon name="chart" />} />
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        {token ? (
          <button
            onClick={() => {
              clearToken();
              setToken(null);
              router.push("/login");
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="text-slate-400">
              <Icon name="logout" />
            </span>
            Log Out
          </button>
        ) : null}
      </div>
    </aside>
  );
}

