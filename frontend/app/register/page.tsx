"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/context/UserContext";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { getOAuthProviders } from "@/services/api";
import { registerSchema, firstFieldErrors } from "@/utils/schemas";

export default function RegisterPage() {
  const { register, loginWithOAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);

  useEffect(() => {
    getOAuthProviders()
      .then((res) => setOauthProviders(res.providers))
      .catch(() => {});
  }, []);

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

    const result = registerSchema.safeParse({ email, username, password, confirmPassword });
    if (!result.success) {
      setFieldErrors(firstFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await register(email, username, password);
      toast.success(`Welcome to C.E.X, ${username}`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuthLogin(provider: string) {
    setError(null);
    try {
      await loginWithOAuth(provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OAuth signup failed");
    }
  }

  function providerDisplayName(provider: string): string {
    switch (provider) {
      case "google": return "Google";
      case "github": return "GitHub";
      default: return provider;
    }
  }

  function providerIcon(provider: string): React.ReactNode {
    switch (provider) {
      case "google":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        );
      case "github":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        );
      default:
        return null;
    }
  }

  function eyeToggleIcon(show: boolean): React.ReactNode {
    return (
      <svg
        className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {show ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
              CX
            </span>
            <span className="text-xl font-semibold tracking-tight">C.E.X</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Join C.E.X and start trading
          </p>
        </div>

        {oauthProviders.length > 0 && (
          <div className="mb-6 space-y-2">
            {oauthProviders.map((provider) => (
              <Button
                key={provider}
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={() => handleOAuthLogin(provider)}
              >
                <span className="mr-2 inline-flex shrink-0 items-center">
                  {providerIcon(provider)}
                </span>
                Sign up with {providerDisplayName(provider)}
              </Button>
            ))}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  or
                </span>
              </div>
            </div>
          </div>
        )}

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
            type="text"
            label="Username"
            placeholder="alice"
            autoComplete="username"
            value={username}
            onChange={(v) => {
              setUsername(v);
              clearFieldError("username");
            }}
            error={fieldErrors.username}
            className="py-2.5"
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••"
            autoComplete="new-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              clearFieldError("password");
            }}
            error={fieldErrors.password}
            className="py-2.5"
          />

          <Input
            type="password"
            label="Confirm password"
            placeholder="••••••"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              clearFieldError("confirmPassword");
            }}
            error={fieldErrors.confirmPassword}
            className="py-2.5"
          />

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
