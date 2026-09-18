"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

/**
 * Responsive dashboard frame: fixed sidebar (drawer on mobile) + header + content.
 */
export function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer when the route changes (state adjustment during render).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <div className="min-h-dvh bg-surface-muted">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-dvh flex-col lg:pl-72">
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl animate-page-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
