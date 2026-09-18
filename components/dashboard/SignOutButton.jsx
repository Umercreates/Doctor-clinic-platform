"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { dashboardRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Revokes the server session, clears the cookie, and returns to the login page. */
export function SignOutButton({ className }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await api.logout();
    } catch {
      // Even if the request fails the cookie may be gone; continue to login.
    }
    router.replace(dashboardRoutes.login);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="h-4.5 w-4.5 text-slate-400" aria-hidden="true" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
