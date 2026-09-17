"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { Card } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { PageLoader } from "@/components/ui/page-loader/PageLoader";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { useAuth } from "@/context/UserContext";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}

export default function SettingsPage() {
  const { connected } = useWebSocketContext();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader />;
  }

  function handleSignOut() {
    logout();
    toast.info("Signed out");
    router.push("/");
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
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage your account
              </p>
            </div>

            <div className="space-y-5">
              <Card
                header={
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Profile</h2>
                    <Badge variant="positive">Active</Badge>
                  </div>
                }
              >
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Username" value={user.username || "—"} />
                  <Field label="Email" value={user.email} />
                  <Field label="User ID" value={user.id} />
                  <Field label="Member since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
                </dl>
              </Card>

              <Card header={<h2 className="text-base font-semibold">Security</h2>}>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  You are signed in with a valid session token (
                  <span className="font-medium">JWT</span>) stored locally. OTP
                  verification is available on requests that require it.
                </p>
              </Card>

              <Card header={<h2 className="text-base font-semibold">Appearance</h2>}>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  The interface follows your system theme automatically.
                </p>
              </Card>

              <Card
                header={<h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger zone</h2>}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Sign out of your account on this device.
                  </p>
                  <Button variant="danger" size="sm" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}