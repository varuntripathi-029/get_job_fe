import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { cn } from "@/lib/utils";
import { PillButton } from "./PillButton";

export type UploadStatus = "idle" | "uploading" | "pending" | "processing" | "ready" | "failed";

interface FileUploadProps {
  accept: string;
  /** In bytes. */
  maxSize: number;
  onUpload: (file: File) => void;
  status: UploadStatus;
  fileName?: string | null;
  error?: string | null;
  className?: string;
}

const ACCEPT_HINT = "PDF or DOCX";

export function FileUpload({
  accept,
  maxSize,
  onUpload,
  status,
  fileName,
  error,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const maxMb = Math.round(maxSize / (1024 * 1024));

  const accepted = (file: File): boolean => {
    if (file.size > maxSize) {
      setLocalError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is ${maxMb}MB.`);
      return false;
    }
    const extensions = accept.split(",").map((item) => item.trim().toLowerCase());
    const name = file.name.toLowerCase();
    if (extensions.length > 0 && !extensions.some((extension) => name.endsWith(extension))) {
      setLocalError(`${ACCEPT_HINT} only.`);
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handle = (file: File | undefined) => {
    if (file && accepted(file)) onUpload(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handle(event.dataTransfer.files?.[0]);
  };

  const busy = status === "uploading" || status === "pending" || status === "processing";

  if (busy) {
    const message =
      status === "uploading" ? "Uploading…" : "Processing your resume — this takes a moment.";
    return (
      <div className={cn("bg-surface border-border rounded-card border p-24", className)}>
        <div className="flex items-center gap-12">
          <FileText className="text-brand size-20 shrink-0" aria-hidden />
          <span className="text-body-sm text-text-primary truncate">{fileName ?? "resume"}</span>
        </div>
        <div className="bg-surface-raised rounded-pill relative mt-16 h-6 overflow-hidden">
          <div className="animate-shimmer absolute inset-0" />
        </div>
        <p className="text-mono-sm text-text-secondary mt-12">{message}</p>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className={cn("bg-surface border-border rounded-card border p-24", className)}>
        <div className="flex items-center gap-12">
          <CheckCircle2 className="text-signal-green size-20 shrink-0" aria-hidden />
          <span className="text-body-sm text-text-primary truncate">{fileName ?? "resume"}</span>
        </div>
      </div>
    );
  }

  const shownError = error ?? localError;

  return (
    <div className={className}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-card flex flex-col items-center justify-center border-2 border-dashed px-24 py-48 text-center transition-colors duration-200",
          dragging ? "border-brand bg-brand-5" : "border-border",
          status === "failed" && "border-signal-red",
        )}
      >
        {status === "failed" ? (
          <AlertTriangle className="text-signal-red size-32" strokeWidth={1.25} aria-hidden />
        ) : (
          <Upload className="text-text-muted size-32" strokeWidth={1.25} aria-hidden />
        )}

        <p className="text-body text-text-primary mt-16">
          {status === "failed" ? "That didn't work" : "Drop your resume here"}
        </p>
        <p className="text-mono-sm text-text-secondary mt-8">
          {ACCEPT_HINT} · up to {maxMb}MB
        </p>

        <PillButton variant="outlined" className="mt-24" onClick={() => inputRef.current?.click()}>
          {status === "failed" ? "Try another file" : "Choose file"}
        </PillButton>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            handle(event.target.files?.[0]);
            // Reset so picking the same file twice still fires a change.
            event.target.value = "";
          }}
        />
      </div>

      {shownError && (
        <p role="alert" className="text-mono-sm text-signal-red mt-12">
          {shownError}
        </p>
      )}
    </div>
  );
}
