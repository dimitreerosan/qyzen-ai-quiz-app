"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { clearToken, getToken } from "@/lib/auth";
import * as React from "react";

function Icon({
  name,
  className = ""
}: {
  name: "spark" | "grid" | "quiz" | "trophy" | "login" | "logout";
  className?: string;
}) {
  const common = "h-4 w-4";
  switch (name) {
    case "spark":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={["h-5 w-5", className].join(" ")} aria-hidden="true">
          <path
            d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M19 13l.7 3 2.3.9-2.3.9-.7 3-.7-3-2.3-.9 2.3-.9.7-3z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={[common, className].join(" ")} aria-hidden="true">
          <path
            d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "quiz":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={[common, className].join(" ")} aria-hidden="true">
          <path d="M7 7h10M7 12h6M7 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "trophy":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={[common, className].join(" ")} aria-hidden="true">
          <path
            d="M8 4h8v3a4 4 0 01-8 0V4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M6 4H4v2a4 4 0 004 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 4h2v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 11v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "login":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={[common, className].join(" ")} aria-hidden="true">
          <path
            d="M10 7V5a2 2 0 012-2h7a2 2 0 012 2v14a2 2 0 01-2 2h-7a2 2 0 01-2-2v-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M3 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M7 8l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={[common, className].join(" ")} aria-hidden="true">
          <path
            d="M14 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M21 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M17 8l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function NavLink({
  href,
  icon,
  children
}: {
  href: string;
  icon: "grid" | "quiz" | "trophy";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
        active ? "bg-ink-900 text-white shadow-glow" : "text-black/70 hover:bg-black/5 hover:text-ink-900"
      ].join(" ")}
    >
      <Icon name={icon} className={active ? "text-white" : "text-black/60"} />
      <span>{children}</span>
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToken(getToken());
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur">
      <div className="app-container flex items-center justify-between py-4">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-ink-900 text-white shadow-glow">
            <Icon name="spark" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-900">Qyzen</div>
            <div className="text-xs text-black/50">AI-powered quizzes</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink href="/dashboard" icon="grid">
            Dashboard
          </NavLink>
          <NavLink href="/quiz" icon="quiz">
            Quiz
          </NavLink>
          <NavLink href="/results" icon="trophy">
            Results
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {token ? (
            <Button
              variant="secondary"
              onClick={() => {
                clearToken();
                setToken(null);
                router.push("/login");
              }}
            >
              <Icon name="logout" />
              Logout
            </Button>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost">
                  <Icon name="login" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
