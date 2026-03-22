"use client";

import Link from "next/link";
import { Button } from "@/components/Button";

export type QuizCardProps = {
  title: string;
  subtitle?: string;
  href?: string;
  meta?: Array<{ label: string; value: string }>;
};

export function QuizCard({ title, subtitle, href, meta }: QuizCardProps) {
  const body = (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-ink-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-black/60">{subtitle}</div> : null}
        </div>
        {href ? (
          <Button variant="secondary" className="shrink-0">
            View
          </Button>
        ) : null}
      </div>
      {meta?.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {meta.map((m) => (
            <div key={m.label} className="rounded-xl bg-black/[0.03] px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-black/50">{m.label}</div>
              <div className="text-sm font-medium text-ink-900">{m.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block">
      {body}
    </Link>
  );
}

