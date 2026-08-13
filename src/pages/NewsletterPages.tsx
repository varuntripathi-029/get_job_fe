import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, MailX } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { pillClasses } from "@/components/ui/PillButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage, newsletterApi } from "@/lib/api";
import { setPageTitle } from "@/lib/utils";

/** Both pages POST a one-time token on mount.
 *
 * A mutation rather than a query, because confirming is a side effect: React
 * Query would happily retry or refetch a query, and this token is single-use. */
function useTokenAction(action: (token: string) => Promise<{ message: string }>, token?: string) {
  const mutation = useMutation({ mutationFn: action });
  const fired = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; the token would be spent twice.
    if (fired.current || !token) return;
    fired.current = true;
    mutation.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return mutation;
}

interface ShellProps {
  title: string;
  children: React.ReactNode;
}

function CenteredCard({ title, children }: ShellProps) {
  useEffect(() => setPageTitle(title), [title]);

  return (
    <div className="min-h-panel flex items-center justify-center py-64">
      <div className="bg-surface border-border rounded-card animate-fade-in w-full max-w-480 border p-32 text-center">
        {children}
        <Link to="/" className={pillClasses({ variant: "outlined", size: "sm", className: "mt-24" })}>
          Back to HireSignal
        </Link>
      </div>
    </div>
  );
}

export function NewsletterConfirmPage() {
  const { token } = useParams();
  const { isPending, isError, isSuccess, error } = useTokenAction(newsletterApi.confirm, token);

  return (
    <CenteredCard title="Confirm subscription">
      {isPending && (
        <>
          <Skeleton variant="circle" className="mx-auto" />
          <Skeleton width="70%" height="20px" className="mx-auto mt-16" />
          <Skeleton width="50%" height="14px" className="mx-auto mt-8" />
        </>
      )}

      {isSuccess && (
        <>
          <CheckCircle2 className="text-signal-green mx-auto size-48" strokeWidth={1.25} aria-hidden />
          <h1 className="text-h3 text-text-primary mt-16">Subscription confirmed</h1>
          <p className="text-body-sm text-text-secondary mt-8">
            You'll get the weekly digest every Monday morning.
          </p>
        </>
      )}

      {isError && (
        <>
          <AlertTriangle className="text-signal-red mx-auto size-48" strokeWidth={1.25} aria-hidden />
          <h1 className="text-h3 text-text-primary mt-16">That link didn't work</h1>
          <p className="text-body-sm text-text-secondary mt-8">
            {errorMessage(error, "The link may have expired or already been used.")}
          </p>
        </>
      )}
    </CenteredCard>
  );
}

export function NewsletterUnsubscribePage() {
  const { token } = useParams();
  const { isPending, isError, isSuccess, error } = useTokenAction(newsletterApi.unsubscribe, token);

  return (
    <CenteredCard title="Unsubscribe">
      {isPending && (
        <>
          <Skeleton variant="circle" className="mx-auto" />
          <Skeleton width="70%" height="20px" className="mx-auto mt-16" />
        </>
      )}

      {isSuccess && (
        <>
          <MailX className="text-text-muted mx-auto size-48" strokeWidth={1.25} aria-hidden />
          <h1 className="text-h3 text-text-primary mt-16">You've been unsubscribed</h1>
          <p className="text-body-sm text-text-secondary mt-8">
            Sorry to see you go. You can resubscribe any time from the home page.
          </p>
        </>
      )}

      {isError && (
        <>
          <AlertTriangle className="text-signal-red mx-auto size-48" strokeWidth={1.25} aria-hidden />
          <h1 className="text-h3 text-text-primary mt-16">That link didn't work</h1>
          <p className="text-body-sm text-text-secondary mt-8">
            {errorMessage(error, "The link may have expired or already been used.")}
          </p>
        </>
      )}
    </CenteredCard>
  );
}
