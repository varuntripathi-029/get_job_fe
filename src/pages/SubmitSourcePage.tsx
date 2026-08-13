import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { Select } from "@/components/ui/Dropdown";
import { PillButton } from "@/components/ui/PillButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { companiesApi, errorMessage, sourcesApi } from "@/lib/api";
import { SOURCE_TYPE_OPTIONS } from "@/lib/constants";
import { cn, isValidUrl, setPageTitle } from "@/lib/utils";
import type { SourceType } from "@/types";

/** Best-effort guess from the URL so the user usually just confirms it.
 * Ordered most-specific first — an ATS host is a stronger tell than "/careers". */
function detectSourceType(url: string): SourceType | "" {
  if (!isValidUrl(url)) return "";
  const value = url.toLowerCase();

  const atsHosts = [
    "greenhouse.io",
    "lever.co",
    "ashbyhq.com",
    "workable.com",
    "recruitee.com",
    "breezy.hr",
    "freshteam.com",
    "pinpointhq.com",
  ];
  if (atsHosts.some((host) => value.includes(host))) return "ats_api";
  if (value.includes("github.com")) return "github_org";
  if (/\/(feed|rss|atom)(\/|\.xml|$)/.test(value)) return "rss_feed";
  if (/(careers?|jobs|join-us|work-with-us|openings)/.test(value)) return "career_page";
  if (/(engineering|tech|developers?)\.|\/engineering/.test(value)) return "engineering_blog";
  if (/\/blog/.test(value)) return "company_blog";
  return "";
}

export function SubmitSourcePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<SourceType | "">("");
  const [touchedType, setTouchedType] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => setPageTitle("Submit a source"), []);

  const urlValid = url.trim().length > 0 && isValidUrl(url.trim());
  const detected = useMemo(() => detectSourceType(url.trim()), [url]);

  // The guess follows the URL until the user overrides it, then it stops.
  useEffect(() => {
    if (!touchedType && detected) setSourceType(detected);
  }, [detected, touchedType]);

  const debouncedCompany = useDebounce(companyQuery, 300);
  const { data: companies } = useQuery({
    queryKey: ["companies", "submit-picker", debouncedCompany],
    queryFn: () => companiesApi.list({ search: debouncedCompany, per_page: 8 }),
    enabled: debouncedCompany.trim().length >= 2,
  });

  const submit = useMutation({
    mutationFn: () =>
      sourcesApi.submit({
        url: url.trim(),
        source_type: sourceType as SourceType,
        company_id: companyId,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Source submitted for review");
      navigate("/submissions");
    },
    onError: (error) => toast.error(errorMessage(error, "Submission failed")),
  });

  const canSubmit = urlValid && Boolean(sourceType) && !submit.isPending;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    submit.mutate();
  };

  return (
    <div className="pb-32">
      <PageHeader
        title="Submit a source"
        subtitle="Careers pages, engineering blogs, RSS feeds and ATS boards. An admin reviews each one before it goes into the crawl rotation."
      />

      <form onSubmit={onSubmit} className="bg-surface border-border rounded-card max-w-720 border p-24">
        {/* URL */}
        <label className="block">
          <span className="text-mono-sm text-text-muted uppercase">Source URL</span>
          <div className="relative mt-8">
            <input
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://company.com/careers"
              className={cn(
                "bg-void rounded-input text-body-sm text-text-primary w-full border px-16 py-12 pr-40 transition-colors duration-150 outline-none",
                url.length === 0
                  ? "border-border focus:border-signal-indigo"
                  : urlValid
                    ? "border-signal-green"
                    : "border-signal-red",
              )}
            />
            {url.length > 0 && (
              <span className="absolute top-1/2 right-12 -translate-y-1/2">
                {urlValid ? (
                  <Check className="text-signal-green size-16" aria-label="Valid URL" />
                ) : (
                  <X className="text-signal-red size-16" aria-label="Not a valid URL" />
                )}
              </span>
            )}
          </div>
          {url.length > 0 && !urlValid && (
            <p className="text-mono-sm text-signal-red mt-8">
              Include the scheme — https://example.com/careers
            </p>
          )}
        </label>

        {/* Source type */}
        <div className="mt-24">
          <span className="text-mono-sm text-text-muted uppercase">Source type</span>
          <div className="mt-8 flex flex-wrap items-center gap-12">
            <Select
              label="Source type"
              value={sourceType}
              placeholder="Choose a type…"
              options={SOURCE_TYPE_OPTIONS}
              onChange={(value) => {
                setTouchedType(true);
                setSourceType(value as SourceType);
              }}
            />
            {detected && !touchedType && (
              <span className="text-mono-sm text-text-muted">auto-detected</span>
            )}
          </div>
        </div>

        {/* Company */}
        <div className="mt-24">
          <span className="text-mono-sm text-text-muted uppercase">Company</span>
          <p className="text-caption text-text-secondary mt-4">
            Leave blank for a general news or industry feed that isn't about one company.
          </p>

          {companyId ? (
            <div className="mt-8 flex items-center gap-8">
              <PillButton
                variant="outlined"
                size="sm"
                active
                onClick={() => {
                  setCompanyId(null);
                  setCompanyName("");
                }}
              >
                {companyName}
                <X className="size-12" aria-hidden />
              </PillButton>
            </div>
          ) : (
            <div className="relative mt-8">
              <SearchInput
                value={companyQuery}
                onChange={setCompanyQuery}
                placeholder="Search tracked companies…"
              />
              {(companies?.items.length ?? 0) > 0 && debouncedCompany.trim().length >= 2 && (
                <ul className="animate-scale-in bg-surface border-border-bright rounded-card shadow-hover z-dropdown absolute inset-x-0 top-full mt-8 border p-4">
                  {companies?.items.map((company) => (
                    <li key={company.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCompanyId(company.id);
                          setCompanyName(company.name);
                          setCompanyQuery("");
                        }}
                        className="text-body-sm text-text-primary rounded-input hover:bg-surface-raised block w-full truncate px-12 py-8 text-left transition-colors duration-150"
                      >
                        {company.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <label className="mt-24 block">
          <span className="text-mono-sm text-text-muted uppercase">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Anything the reviewer should know."
            className="bg-void border-border rounded-input text-body-sm text-text-primary focus:border-signal-indigo mt-8 w-full resize-y border px-16 py-12 transition-colors duration-150 outline-none"
          />
        </label>

        <div className="mt-32 flex justify-end gap-8">
          <PillButton variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </PillButton>
          <PillButton type="submit" disabled={!canSubmit}>
            {submit.isPending ? "Submitting…" : "Submit for review"}
          </PillButton>
        </div>
      </form>
    </div>
  );
}
