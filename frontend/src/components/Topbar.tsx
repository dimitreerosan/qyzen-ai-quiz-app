"use client";

import * as React from "react";
import { getCurrentUser, type User } from "@/lib/api";
import { getToken } from "@/lib/auth";

function Icon({ name, className = "" }: { name: "user"; className?: string }) {
  const c = ["h-4 w-4", className].join(" ");
  switch (name) {
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={c} aria-hidden="true">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function Topbar() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userLoading, setUserLoading] = React.useState(false);

  React.useEffect(() => {
    const token = getToken();
    if (!token) return;
    setUserLoading(true);
    getCurrentUser(token)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  const displayName = user?.username ?? (userLoading ? "" : "User");

  return (
    <div className="flex items-center justify-end gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 pr-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-brand-50 text-brand-600">
            <Icon name="user" />
          </div>
          <div className="hidden text-sm font-medium text-slate-700 sm:block">{displayName}</div>
        </div>
      </div>
    </div>
  );
}

