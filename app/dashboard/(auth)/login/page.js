import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Alert } from "@/components/ui/Alert";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { routes } from "@/lib/routes";
import { getClinicSettings } from "@/server/services/contentService";
import { getCurrentUser } from "@/server/auth/currentUser";
import { safeNextPath } from "@/server/auth/pageGuards";
import { isDatabaseConfigured } from "@/lib/database";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Staff sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  // Already signed in? Go straight to the dashboard.
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  const authReady = isDatabaseConfigured() && isSupabaseConfigured();
  const clinic = await getClinicSettings();

  return (
    <main id="main-content" className="flex min-h-dvh bg-surface-muted">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex" aria-hidden="true">
        <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-accent-400/25 blur-3xl" />
        <Logo clinic={clinic} tone="light" size={46} href={routes.home} />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">Staff dashboard</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight">Manage appointments, patients and the website in one place.</h2>
          <p className="mt-4 text-white/75">
            Secure access for {clinic.name} staff. Sign in to view the schedule, review booking requests, and update site content.
          </p>
        </div>
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} {clinic.name}. Authorized personnel only.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md animate-slide-up">
          <div className="lg:hidden">
            <Logo size={42} href={routes.home} />
          </div>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8 lg:mt-0">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Staff sign in</h1>
            <p className="mt-2 text-sm text-slate-600">Use your clinic account to access the dashboard.</p>
            {!authReady && (
              <Alert tone="warning" className="mt-5" title="Sign-in not configured">
                Set <code>DATABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>, then run{" "}
                <code>npm run db:setup</code> to create staff accounts in Supabase Auth.
              </Alert>
            )}
            <div className="mt-7">
              <LoginForm nextPath={nextPath} />
            </div>
          </div>
          <div className="mt-6 text-sm">
            <Link href={routes.home} className="link-underline inline-flex items-center gap-1.5 rounded-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to website
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
