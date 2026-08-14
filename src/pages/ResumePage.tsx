import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { MatchCard } from "@/components/cards/MatchCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileUpload, type UploadStatus } from "@/components/ui/FileUpload";
import { FilterPillGroup } from "@/components/ui/FilterPillGroup";
import { Modal } from "@/components/ui/Modal";
import { PillButton } from "@/components/ui/PillButton";
import { JobCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useUrlState } from "@/hooks/useUrlState";
import { errorMessage, resumesApi } from "@/lib/api";
import {
  label as labelOf,
  ROLE_FAMILY_OPTIONS,
  SENIORITY_OPTIONS,
  WORK_MODE_OPTIONS,
} from "@/lib/constants";
import { formatDate, setPageTitle } from "@/lib/utils";
import type { Resume, RoleFamily, Seniority, WorkMode } from "@/types";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx";

export function ResumePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  useEffect(() => setPageTitle("My resume"), []);

  const { data: resume, isPending } = useQuery({
    queryKey: ["resume", "me"],
    queryFn: resumesApi.me,
    // Poll only while the worker is still chewing on it — a ready or failed
    // resume is terminal and does not need watching.
    refetchInterval: (query) => {
      const status = query.state.data?.indexing_status;
      return status === "pending" || status === "processing" ? 3000 : false;
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => resumesApi.upload(file),
    onMutate: () => setUploading(true),
    onSuccess: (result) => {
      queryClient.setQueryData(["resume", "me"], result.resume);
      toast.success("Uploaded — parsing now.");
    },
    onError: (error) => toast.error(errorMessage(error, "Upload failed")),
    onSettled: () => setUploading(false),
  });

  const remove = useMutation({
    mutationFn: resumesApi.remove,
    onSuccess: () => {
      queryClient.setQueryData(["resume", "me"], null);
      queryClient.removeQueries({ queryKey: ["resume", "matches"] });
      toast.success("Resume deleted");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not delete")),
  });

  if (isPending) {
    return (
      <div className="pb-32">
        <PageHeader title="My resume" />
        <Skeleton height="200px" />
      </div>
    );
  }

  const status: UploadStatus = uploading
    ? "uploading"
    : (resume?.indexing_status as UploadStatus | undefined) ?? "idle";

  return (
    <div className="pb-32">
      <PageHeader
        title="My resume"
        subtitle="Uploaded once, matched against every tracked job. Delete it any time."
      />

      {!resume ? (
        <FileUpload
          accept={ACCEPT}
          maxSize={MAX_SIZE}
          status={status}
          onUpload={(file) => upload.mutate(file)}
        />
      ) : resume.indexing_status === "failed" ? (
        <div className="flex flex-col gap-16">
          <div className="bg-signal-red-bg border-signal-red rounded-card flex items-start gap-12 border p-16">
            <AlertTriangle className="text-signal-red mt-2 size-16 shrink-0" aria-hidden />
            <div>
              <p className="text-body-sm text-text-primary">Processing failed</p>
              <p className="text-mono-sm text-text-secondary mt-4">
                {resume.indexing_error ?? "The file could not be parsed. Try uploading it again."}
              </p>
            </div>
          </div>
          <FileUpload
            accept={ACCEPT}
            maxSize={MAX_SIZE}
            status={uploading ? "uploading" : "failed"}
            fileName={resume.file_name}
            onUpload={(file) => upload.mutate(file)}
          />
        </div>
      ) : resume.indexing_status !== "ready" ? (
        <FileUpload
          accept={ACCEPT}
          maxSize={MAX_SIZE}
          status={status}
          fileName={resume.file_name}
          onUpload={(file) => upload.mutate(file)}
        />
      ) : (
        <>
          <ParsedResume resume={resume} onDelete={() => remove.mutate()} deleting={remove.isPending} />
          <MatchesSection resume={resume} />
        </>
      )}
    </div>
  );
}

/* ── Parsed summary ───────────────────────────────────────────────────── */

function ParsedResume({
  resume,
  onDelete,
  deleting,
}: {
  resume: Resume;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="bg-surface border-border rounded-card border p-24">
      <div className="flex flex-wrap items-start justify-between gap-16">
        <div className="flex items-center gap-12">
          <FileText className="text-brand size-20 shrink-0" aria-hidden />
          <div>
            <p className="text-body text-text-primary">{resume.file_name ?? "resume"}</p>
            <p className="text-mono-sm text-text-muted mt-4">
              Parsed {formatDate(resume.parsed_at)}
              {resume.expires_at && ` · expires ${formatDate(resume.expires_at)}`}
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-24 grid grid-cols-1 gap-20 sm:grid-cols-2">
        {resume.parsed_seniority && (
          <Field label="Seniority">{labelOf(resume.parsed_seniority)}</Field>
        )}
        {resume.parsed_experience_years != null && (
          <Field label="Experience">
            {resume.parsed_experience_years} {resume.parsed_experience_years === 1 ? "year" : "years"}
          </Field>
        )}
        {resume.parsed_role_families && resume.parsed_role_families.length > 0 && (
          <Field label="Functions">
            {resume.parsed_role_families.map((family) => labelOf(family)).join(", ")}
          </Field>
        )}
        {resume.work_mode_preference && (
          <Field label="Prefers">{labelOf(resume.work_mode_preference)}</Field>
        )}
        {resume.parsed_locations && resume.parsed_locations.length > 0 && (
          <Field label="Locations">{resume.parsed_locations.join(", ")}</Field>
        )}
      </dl>

      {resume.parsed_skills && resume.parsed_skills.length > 0 && (
        <div className="mt-24">
          <p className="text-mono-sm text-text-muted mb-8 uppercase">Skills</p>
          <div className="flex flex-wrap gap-8">
            {resume.parsed_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-pill bg-brand-10 text-mono-sm text-brand px-12 py-6"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-mono-sm text-text-muted hover:text-signal-red mt-24 transition-colors duration-150"
      >
        Delete resume
      </button>

      <Modal open={confirming} onClose={() => setConfirming(false)} label="Delete resume">
        <div className="p-32">
          <h2 className="text-h3 text-text-primary">Delete your resume?</h2>
          <p className="text-body-sm text-text-secondary mt-8">
            This removes the file, the parsed profile and your job matches. You can upload a new one
            afterwards.
          </p>
          <div className="mt-24 flex justify-end gap-8">
            <PillButton variant="outlined" onClick={() => setConfirming(false)}>
              Cancel
            </PillButton>
            <PillButton
              disabled={deleting}
              onClick={() => {
                setConfirming(false);
                onDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </PillButton>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-mono-sm text-text-muted uppercase">{label}</dt>
      <dd className="text-body-sm text-text-primary mt-4">{children}</dd>
    </div>
  );
}

/* ── Matches ──────────────────────────────────────────────────────────── */

function MatchesSection({ resume }: { resume: Resume }) {
  const { get, patch } = useUrlState();

  // Filters start from what the resume says about the candidate, so the first
  // view is already relevant rather than the whole job board.
  const roleFamily = (get("role_family") || resume.parsed_role_families?.[0] || "") as RoleFamily | "";
  const seniority = (get("seniority") || resume.parsed_seniority || "") as Seniority | "";
  const workMode = (get("work_mode") || resume.work_mode_preference || "") as WorkMode | "";

  const { data, isPending, isError } = useQuery({
    queryKey: ["resume", "matches", { roleFamily, seniority, workMode }],
    queryFn: () =>
      resumesApi.matches({
        role_family: roleFamily || undefined,
        seniority: seniority || undefined,
        work_mode: workMode || undefined,
        limit: 20,
      }),
  });

  const matches = data?.matches ?? [];

  return (
    <section className="mt-48">
      <h2 className="text-h2 text-text-primary mb-8">Matched jobs</h2>
      <p className="text-body-sm text-text-secondary mb-24">
        Ranked by similarity between your resume and each job description.
      </p>

      <div className="mb-24 flex flex-col gap-16">
        <FilterPillGroup
          label="Function"
          options={ROLE_FAMILY_OPTIONS}
          selected={roleFamily ? [roleFamily] : []}
          onChange={(selected) => patch({ role_family: selected[0] ?? "" })}
        />
        <FilterPillGroup
          label="Seniority"
          options={SENIORITY_OPTIONS}
          selected={seniority ? [seniority] : []}
          onChange={(selected) => patch({ seniority: selected[0] ?? "" })}
        />
        <FilterPillGroup
          label="Work mode"
          options={WORK_MODE_OPTIONS}
          selected={workMode ? [workMode] : []}
          onChange={(selected) => patch({ work_mode: selected[0] ?? "" })}
        />
      </div>

      {isPending ? (
        <div className="flex flex-col gap-12">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : isError ? (
        <EmptyState icon={Sparkles} title="Couldn't load matches" />
      ) : data?.message ? (
        <EmptyState icon={Sparkles} title="Still working" description={data.message} />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No matching jobs found"
          description="Try clearing a filter — the defaults are taken from your resume and may be narrow."
          action={{ label: "Clear filters", onClick: () => patch({ role_family: "", seniority: "", work_mode: "" }) }}
        />
      ) : (
        <div className="flex flex-col gap-12">
          {matches.map((match, index) => (
            <MatchCard key={match.job.id} match={match} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
