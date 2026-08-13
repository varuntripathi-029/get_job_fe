import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AdminGuard, AuthGuard } from "@/components/auth/Guards";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

// The landing page is eager — it is the first paint for most visitors and
// should not wait on a second round trip. Everything else is split, which
// keeps Recharts and the admin console out of the initial bundle.
import { LandingPage } from "@/pages/LandingPage";

/** Wraps a lazily-loaded page in the skeleton the shell shows while it lands. */
function page(loader: () => Promise<{ [key: string]: unknown }>, name: string) {
  const Lazy = lazy(async () => {
    const module = await loader();
    return { default: module[name] as ComponentType };
  });
  return (
    <Suspense fallback={<RouteFallback />}>
      <Lazy />
    </Suspense>
  );
}

function RouteFallback() {
  return (
    <div className="space-y-16 pt-32">
      <Skeleton width="260px" height="36px" />
      <Skeleton width="180px" height="14px" />
      <Skeleton variant="card" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/companies", element: page(() => import("@/pages/CompaniesPage"), "CompaniesPage") },
      // Declared before the :slug route so "compare" is not read as a slug.
      {
        path: "/companies/compare",
        element: page(() => import("@/pages/ComparisonPage"), "ComparisonPage"),
      },
      {
        path: "/companies/:slug",
        element: page(() => import("@/pages/CompanyDetailPage"), "CompanyDetailPage"),
      },
      { path: "/jobs", element: page(() => import("@/pages/JobsPage"), "JobsPage") },
      { path: "/events", element: page(() => import("@/pages/EventsPage"), "EventsPage") },
      { path: "/search", element: page(() => import("@/pages/SearchPage"), "SearchPage") },
      { path: "/sources", element: page(() => import("@/pages/SourcesPage"), "SourcesPage") },
      {
        path: "/newsletter/confirm/:token",
        element: page(() => import("@/pages/NewsletterPages"), "NewsletterConfirmPage"),
      },
      {
        path: "/newsletter/unsubscribe/:token",
        element: page(() => import("@/pages/NewsletterPages"), "NewsletterUnsubscribePage"),
      },

      // Auth required
      {
        path: "/resume",
        element: <AuthGuard>{page(() => import("@/pages/ResumePage"), "ResumePage")}</AuthGuard>,
      },
      {
        path: "/submissions",
        element: (
          <AuthGuard>{page(() => import("@/pages/SubmissionsPage"), "SubmissionsPage")}</AuthGuard>
        ),
      },
      {
        path: "/submit-source",
        element: (
          <AuthGuard>{page(() => import("@/pages/SubmitSourcePage"), "SubmitSourcePage")}</AuthGuard>
        ),
      },

      // Admin required
      {
        path: "/admin",
        element: (
          <AdminGuard>
            {page(() => import("@/pages/AdminDashboardPage"), "AdminDashboardPage")}
          </AdminGuard>
        ),
      },
      {
        path: "/admin/newsletter",
        element: (
          <AdminGuard>
            {page(() => import("@/pages/AdminNewsletterPage"), "AdminNewsletterPage")}
          </AdminGuard>
        ),
      },

      { path: "*", element: page(() => import("@/pages/NotFoundPage"), "NotFoundPage") },
    ],
  },
]);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function App() {
  return (
    <ErrorBoundary label="application">
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemeProvider>
            <ToastProvider>
              {/* Inside QueryClientProvider — it clears the cache on sign-out. */}
              <AuthProvider>
                <RouterProvider router={router} />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
