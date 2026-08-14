import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { clamp, cn } from "@/lib/utils";
import type { JobMatch } from "@/types";
import { JobCard } from "./JobCard";

interface MatchCardProps {
  match: JobMatch;
  index?: number;
}

/** A JobCard plus the two things that only exist for a match: how close it is,
 * and why the backend thinks so. The reasons matter more than the number —
 * a bare 0.87 tells a candidate nothing actionable. */
export function MatchCard({ match, index = 0 }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const percent = clamp(Math.round(match.similarity_score * 100), 0, 100);

  return (
    <JobCard job={match.job} index={index}>
      <div className="border-border mt-16 border-t pt-16">
        <div className="flex items-center gap-12">
          <div
            className="bg-surface-raised rounded-pill h-6 flex-1 overflow-hidden"
            role="img"
            aria-label={`${percent}% match`}
          >
            <div
              className="bg-brand h-full rounded-pill transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-mono text-brand tabular-nums">{percent}%</span>
        </div>

        {match.match_reasons.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="text-mono-sm text-text-secondary hover:text-text-primary mt-12 inline-flex items-center gap-4 transition-colors duration-150"
            >
              <ChevronDown
                className={cn("size-12 transition-transform duration-200", expanded && "rotate-180")}
                aria-hidden
              />
              Why this matches
            </button>

            {expanded && (
              <ul className="mt-8 space-y-6">
                {match.match_reasons.map((reason) => (
                  <li key={reason} className="text-caption text-text-secondary flex gap-8">
                    <span aria-hidden className="text-brand">
                      ·
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </JobCard>
  );
}
