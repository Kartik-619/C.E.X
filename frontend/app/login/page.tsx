"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/context/UserContext";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { PasswordToggle } from "@/components/ui/password-toggle/PasswordToggle";
import { loginSchema, firstFieldErrors } from "@/utils/schemas";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(firstFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
              CX
            </span>
            <span className="text-xl font-semibold tracking-tight">C.E.X</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access the dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              clearFieldError("email");
            }}
            error={fieldErrors.email}
            className="py-2.5"
          />

          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder={showPassword ? "your password" : "••••••"}
            autoComplete="current-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              clearFieldError("password");
            }}
            error={fieldErrors.password}
            className="py-2.5"
            suffix={
              <PasswordToggle
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
