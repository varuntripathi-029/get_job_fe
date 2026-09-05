import { ArrowUpRight, MapPin } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { MomentumBadge } from "@/components/ui/MomentumScore";
import { pillClasses } from "@/components/ui/PillButton";
import { useMagicCard } from "@/hooks/useMagicCard";
import { label as labelOf, seniorityClass } from "@/lib/constants";
import { cn, relativeTime } from "@/lib/utils";
import type { Job, MomentumLevel } from "@/types";

const MAX_SKILLS = 6;

interface JobCardProps {
  job: Job;
  /** The list endpoint does not join the company score, so pages that know it
   * pass it down rather than firing a request per card. */
  momentumLevel?: MomentumLevel | null;
  index?: number;
  className?: string;
  children?: React.ReactNode;
}

export function JobCard({ job, momentumLevel, index = 0, className, children }: JobCardProps) {
  const location = job.location_normalized ?? job.location_raw;
  const cardRef = useRef<HTMLElement>(null);
  useMagicCard(cardRef, { particleCount: 6, clickEffect: true });

  return (
    <article
      ref={cardRef}
      className={cn(
        "magic-card animate-fade-in bg-surface border-border rounded-card border p-16 transition-all duration-250 ease-out",
        "hover-lift hover:border-border-bright",
        className,
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-12">
        <div className="min-w-0 flex-1">
          <h3 className="text-body text-text-primary font-medium">{job.title}</h3>

          <div className="mt-6 flex flex-wrap items-center gap-8">
            {job.company_slug && job.company_name ? (
              <Link
                to={`/companies/${job.company_slug}`}
                className="text-mono text-brand hover:text-brand-light transition-colors duration-150"
              >
                {job.company_name}
              </Link>
            ) : (
              job.company_name && <span className="text-mono text-text-secondary">{job.company_name}</span>
            )}
            {momentumLevel && <MomentumBadge level={momentumLevel} />}
          </div>
        </div>

        {job.application_url && (
          <a
            href={job.application_url}
            target="_blank"
            rel="noreferrer noopener"
            className={pillClasses({ variant: "outlined", size: "sm" })}
          >
            Apply
            <ArrowUpRight className="size-14" aria-hidden />
          </a>
        )}
      </div>

      <div className="mt-12 flex flex-wrap gap-6">
        {job.role_family && <Tag>{labelOf(job.role_family)}</Tag>}
        {job.seniority && (
          <Tag className={seniorityClass(job.seniority)}>{labelOf(job.seniority)}</Tag>
        )}
        {job.work_mode && <Tag>{labelOf(job.work_mode)}</Tag>}
        {!job.is_active && <Tag className="text-text-muted">Closed</Tag>}
      </div>

      {/* Skills come off the parsed description and are frequently absent or
          enormous — show a handful and count the rest rather than wrapping
          twenty pills across the card. */}
      {job.skills && job.skills.length > 0 && (
        <div className="mt-12 flex flex-wrap items-center gap-6">
          {job.skills.slice(0, MAX_SKILLS).map((skill) => (
            <span
              key={skill}
              className="rounded-pill bg-brand-10 text-mono-xs text-brand px-8 py-4"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > MAX_SKILLS && (
            <span className="text-mono-xs text-text-muted">
              +{job.skills.length - MAX_SKILLS} more
            </span>
          )}
        </div>
      )}

      <div className="text-mono-sm text-text-muted mt-12 flex flex-wrap items-center gap-x-12 gap-y-4">
        <span className="inline-flex items-center gap-4">
          <MapPin className="size-12" aria-hidden />
          {location ?? "Location not specified"}
        </span>
        <span>First seen {relativeTime(job.first_seen_at)}</span>
      </div>

      {children}
    </article>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-pill border-border-bright text-mono-xs text-text-secondary border px-8 py-4",
        className,
      )}
    >
      {children}
    </span>
  );
}
