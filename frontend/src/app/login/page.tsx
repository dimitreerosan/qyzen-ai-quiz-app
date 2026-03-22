"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/Button";
import { InputField } from "@/components/InputField";
import { login } from "@/lib/api";
import { setTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const canSubmit = username.trim().length > 0 && password.length >= 1 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ username: username.trim(), password });
      setTokens({ access: res.access, refresh: res.refresh });
      router.push("/quiz");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-black/60">Log in to generate and take quizzes.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" className="w-full" isLoading={loading} disabled={!canSubmit}>
            Log in
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-black/60">
          New here?{" "}
          <Link href="/register" className="font-medium text-ink-900 underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

