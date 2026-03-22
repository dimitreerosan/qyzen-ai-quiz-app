"use client";

import * as React from "react";

export type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function InputField({ label, error, className = "", ...props }: InputFieldProps) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-ink-900">{label}</div>
      <input
        className={[
          "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition",
          "border-black/10 focus:border-ink-900/30 focus:ring-2 focus:ring-ink-900/10",
          error ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "",
          className
        ].join(" ")}
        {...props}
      />
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </label>
  );
}

