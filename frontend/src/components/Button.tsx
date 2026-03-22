"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  isLoading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-[1px]";

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-white shadow-glow hover:bg-ink-800",
  secondary: "bg-white/70 text-ink-900 border border-black/10 hover:bg-black/5 backdrop-blur",
  ghost: "bg-transparent text-ink-900 hover:bg-black/5"
};

export function Button({ variant = "primary", isLoading, className = "", children, ...props }: ButtonProps) {
  return (
    <button className={[base, variants[variant], className].join(" ")} {...props} disabled={props.disabled || isLoading}>
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          <span>Loading</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

