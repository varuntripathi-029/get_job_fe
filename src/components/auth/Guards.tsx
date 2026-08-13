import { Lock } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";

function RestoringSession() {
  return (
    <div className="space-y-16 py-48">
      <Skeleton width="240px" height="32px" />
      <Skeleton variant="card" />
    </div>
  );
}

/** Renders children only when signed in. Anonymous visitors get the sign-in
 * modal plus an explanation, rather than a silent redirect that loses the URL
 * they were trying to reach. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring, promptSignIn } = useAuth();

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) promptSignIn();
  }, [isRestoring, isAuthenticated, promptSignIn]);

  if (isRestoring) return <RestoringSession />;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to continue"
        description="This page is tied to your account — sign in with Google to see it."
        action={{ label: "Sign in", onClick: promptSignIn }}
      />
    );
  }

  return <>{children}</>;
}

/** Admin-only. A signed-in non-admin is bounced home; there is nothing useful
 * to show them and the backend would reject the calls anyway. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isRestoring, promptSignIn } = useAuth();

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) promptSignIn();
  }, [isRestoring, isAuthenticated, promptSignIn]);

  if (isRestoring) return <RestoringSession />;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to continue"
        description="The admin console requires an administrator account."
        action={{ label: "Sign in", onClick: promptSignIn }}
      />
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
