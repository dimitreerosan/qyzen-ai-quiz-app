"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const QUIZ_ROUTES_HIDE_SIDEBAR = ["/quiz/take"];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_ROUTES.has(pathname);
  const isQuizPath = QUIZ_ROUTES_HIDE_SIDEBAR.some((route) => pathname.startsWith(route));

  if (isAuth || isQuizPath) {
    return (
      <div className="min-h-dvh">
        <main className="app-container py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f5f7fb]">
      <div className="mx-auto min-h-dvh w-full max-w-[1400px] lg:flex">
        <div className="hidden w-[250px] shrink-0 border-r border-slate-200 bg-[#f3f5f9] px-4 py-4 lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
          <Topbar />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

