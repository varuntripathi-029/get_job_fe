import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PillButton } from "@/components/ui/PillButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/context/ToastContext";
import { adminApi, errorMessage } from "@/lib/api";
import { setPageTitle } from "@/lib/utils";

export function AdminNewsletterPage() {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => setPageTitle("Newsletter — Admin"), []);

  const { data: metrics } = useQuery({ queryKey: ["admin", "metrics"], queryFn: adminApi.metrics });

  const {
    data: html,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "newsletter", "preview"],
    queryFn: adminApi.newsletterPreview,
  });

  const send = useMutation({
    mutationFn: () => adminApi.sendNewsletter(false),
    onSuccess: (data) => {
      setConfirming(false);
      const summary = `Edition ${data.edition_number} sent to ${data.sent} of ${data.recipients}`;
      setResult(summary);
      toast.success(summary);
    },
    onError: (mutationError) => {
      setConfirming(false);
      toast.error(errorMessage(mutationError, "Send failed"));
    },
  });

  const recipients = metrics?.total_subscribers ?? 0;

  return (
    <div className="pb-32">
      <PageHeader
        title="Newsletter"
        subtitle="Preview this week's edition, then send it to confirmed subscribers."
        actions={
          <>
            <PillButton
              variant="outlined"
              size="sm"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <Eye className="size-14" aria-hidden />
              {isFetching ? "Refreshing…" : "Refresh preview"}
            </PillButton>
            <PillButton size="sm" disabled={send.isPending} onClick={() => setConfirming(true)}>
              <Send className="size-14" aria-hidden />
              Send now
            </PillButton>
          </>
        }
      />

      <div className="mb-24 grid grid-cols-1 gap-16 sm:grid-cols-3">
        <StatCard label="Confirmed subscribers" value={recipients} icon={Mail} />
        <StatCard label="Companies covered" value={metrics?.total_companies ?? 0} />
        <StatCard label="Signals in window" value={metrics?.total_events ?? 0} />
      </div>

      {result && (
        <p className="bg-signal-green-bg text-signal-green rounded-card text-mono-sm mb-24 px-16 py-12">
          {result}
        </p>
      )}

      <section className="bg-surface border-border rounded-card overflow-hidden border">
        <div className="border-border flex items-center justify-between border-b px-16 py-12">
          <h2 className="text-mono-sm text-text-muted uppercase">Preview</h2>
        </div>

        {isPending ? (
          <div className="space-y-12 p-24">
            <Skeleton width="60%" height="24px" />
            <Skeleton height="200px" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={Mail}
            title="Couldn't render the preview"
            description={errorMessage(error, "The backend could not build this week's edition.")}
          />
        ) : (
          /* Sandboxed iframe: the edition is server-rendered HTML with its own
             styles, and an iframe keeps those from leaking into the console.
             No allow-scripts and no allow-same-origin — it only has to render. */
          <iframe
            title="Newsletter preview"
            srcDoc={html}
            sandbox=""
            className="bg-white h-720 w-full border-0"
          />
        )}
      </section>

      <Modal open={confirming} onClose={() => setConfirming(false)} label="Confirm newsletter send">
        <div className="p-32">
          <h2 className="text-h3 text-text-primary">Send this edition?</h2>
          <p className="text-body-sm text-text-secondary mt-8">
            This emails <span className="text-text-primary font-medium">{recipients}</span> confirmed
            subscribers immediately. It cannot be undone.
          </p>
          <div className="mt-24 flex justify-end gap-8">
            <PillButton variant="outlined" onClick={() => setConfirming(false)}>
              Cancel
            </PillButton>
            <PillButton disabled={send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? "Sending…" : `Send to ${recipients}`}
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
