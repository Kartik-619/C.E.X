"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const { handleOAuthCallback } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      handleOAuthCallback(token);
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [handleOAuthCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Completing sign in...
      </p>
    </div>
  );
}
