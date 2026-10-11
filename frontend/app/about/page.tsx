"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { AboutContent } from "@/components/about/AboutContent";
import { PageLoader } from "@/components/ui/page-loader/PageLoader";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { useAuth } from "@/context/UserContext";

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" title="Go to home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
            CX
          </span>
          <span className="text-lg font-semibold tracking-tight">C.E.X</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:block"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Launch App
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AboutPage() {
  const { connected } = useWebSocketContext();
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <PublicHeader />
        <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
          <AboutContent />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header
        connected={connected}
        onToggleSidebar={() => setMobileNavOpen((v) => !v)}
        username={user.username || user.email}
      />

      <div className="flex flex-1">
        <Sidebar
          className="w-60 shrink-0"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            <AboutContent />
          </div>
        </main>
      </div>
    </div>
  );
}
