import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { EventCard } from "@/components/cards/EventCard";
import { IndustryBreakdownChart } from "@/components/charts/IndustryBreakdownChart";
import { MomentumBadge, MomentumScore, ScoreDelta } from "@/components/ui/MomentumScore";
import { PillButton, pillClasses } from "@/components/ui/PillButton";
import { CompanyCardSkeleton, EventCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useCountUp } from "@/hooks/useCountUp";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { dashboardApi, errorMessage, eventsApi, newsletterApi } from "@/lib/api";
import { colorForName, eventMeta, label as labelOf } from "@/lib/constants";
import { cn, initialOf, isValidEmail, setPageTitle } from "@/lib/utils";
import type { TrendingCompany } from "@/types";

export function LandingPage() {
  useEffect(() => setPageTitle(), []);

  return (
    <div className="flex flex-col gap-section pb-32">
      <HeroSection />
      <TrendingStrip />
      <ActivityFeed />
      <IndustrySection />
      <NewsletterCTA />
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function HeroSection() {
  const { promptSignIn, isAuthenticated } = useAuth();
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.stats,
  });

  return (
    <section className="relative pt-64 pb-32 text-center">
      {/* Radial green wash behind the headline — the one gradient the design
          allows, and only as background light, never on a surface. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-400"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, var(--color-brand-10) 0%, transparent 100%)",
        }}
      />

      <h1 className="text-display text-text-primary animate-fade-in mx-auto max-w-880">
        Track which Indian startups are hiring before they post
      </h1>

      <p
        className="text-body text-text-secondary animate-fade-in mx-auto mt-20 max-w-620"
        style={{ animationDelay: "150ms" }}
      >
        Hiring intelligence built from public signals — funding rounds, new offices, leadership
        moves and job boards. Evidence, not predictions.
      </p>

      <div
        className="animate-fade-in mt-32 flex flex-wrap items-center justify-center gap-12"
        style={{ animationDelay: "300ms" }}
      >
        <Link to="/companies" className={pillClasses({ variant: "filled" })}>
          Explore Companies
          <ArrowRight className="size-14" aria-hidden />
        </Link>
        {!isAuthenticated && (
          <PillButton variant="outlined" onClick={promptSignIn}>
            Sign In
          </PillButton>
        )}
      </div>

      <div
        className="animate-fade-in mx-auto mt-64 grid max-w-720 grid-cols-1 gap-24 sm:grid-cols-3"
        style={{ animationDelay: "450ms" }}
      >
        {isPending ? (
          <>
            <HeroStatSkeleton />
            <HeroStatSkeleton />
            <HeroStatSkeleton />
          </>
        ) : (
          <>
            <HeroStat value={data?.total_companies ?? 0} label="Companies Tracked" />
            <HeroStat value={data?.total_active_jobs ?? 0} label="Active Jobs" />
            <HeroStat value={data?.total_events_30d ?? 0} label="Signals This Month" />
          </>
        )}
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  // Counts up when it scrolls into view rather than on mount, so the numbers
  // are still moving when the eye arrives.
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();
  const counted = useCountUp(value, 800, isVisible);

  return (
    <div ref={ref}>
      <p className="text-score-sm text-text-primary tabular-nums">
        {Math.round(counted).toLocaleString("en-IN")}
      </p>
      <p className="text-mono-sm text-text-muted mt-6 uppercase">{label}</p>
    </div>
  );
}

function HeroStatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8">
      <Skeleton width="88px" height="28px" />
      <Skeleton width="120px" height="12px" />
    </div>
  );
}

/* ── Trending ─────────────────────────────────────────────────────────── */

function TrendingStrip() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["dashboard", "trending", 10],
    queryFn: () => dashboardApi.trending({ limit: 10 }),
  });

  const companies = data?.trending ?? [];

  if (isError || (!isPending && companies.length === 0)) return null;

  return (
    <section>
      <SectionHeading title="Trending Companies" href="/companies?sort_by=momentum_score&sort_order=desc" />
      <div className="no-scrollbar scroll-fade-x -mx-16 flex gap-16 overflow-x-auto px-16 pb-8 sm:mx-0 sm:px-0">
        {isPending
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-260 shrink-0">
                <CompanyCardSkeleton />
              </div>
            ))
          : companies.map((company, index) => (
              <TrendingCard key={company.slug} company={company} index={index} />
            ))}
      </div>
    </section>
  );
}

/** Trending returns its own slim shape (slug, no id, guaranteed delta), so it
 * gets a purpose-built card rather than being forced into CompanyCard. */
function TrendingCard({ company, index }: { company: TrendingCompany; index: number }) {
  return (
    <Link
      to={`/companies/${company.slug}`}
      className={cn(
        "animate-fade-in bg-surface border-border rounded-card group w-260 shrink-0 border p-16 transition-all duration-250 ease-out",
        "hover:border-border-bright hover:shadow-hover hover:-translate-y-2",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-12">
        <span
          aria-hidden
          className="rounded-avatar text-h3 flex size-40 shrink-0 items-center justify-center text-white"
          style={{ background: colorForName(company.name) }}
        >
          {initialOf(company.name)}
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-text-primary group-hover:text-brand truncate font-medium transition-colors duration-200">
            {company.name}
          </p>
          {company.industry && (
            <p className="text-caption text-text-secondary truncate">{labelOf(company.industry)}</p>
          )}
        </div>
      </div>

      <div className="mt-16 flex items-end justify-between gap-8">
        <div className="flex items-baseline gap-8">
          <MomentumScore
            score={company.momentum_score}
            level={company.momentum_label}
            size="sm"
          />
          <ScoreDelta delta={company.score_delta} />
        </div>
        <MomentumBadge level={company.momentum_label} />
      </div>

      {company.top_signal && (
        <p className="text-mono-sm text-text-muted border-border mt-12 truncate border-t pt-12">
          {company.top_signal}
        </p>
      )}
    </Link>
  );
}

/* ── Activity ─────────────────────────────────────────────────────────── */

function ActivityFeed() {
  const { data, isPending } = useQuery({
    queryKey: ["events", "recent", 10],
    queryFn: () => eventsApi.list({ per_page: 10, sort_by: "observed_at", sort_order: "desc", days: 365 }),
  });

  const events = data?.items ?? [];

  return (
    <section>
      <SectionHeading title="Recent Signals" href="/events" />

      {isPending ? (
        <div className="flex flex-col gap-12">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <p className="text-body-sm text-text-secondary">
          No signals recorded yet. The crawler publishes them here as they are found.
        </p>
      ) : (
        // Timeline: a hairline rail with an event-coloured dot per item.
        <ol className="border-border relative flex flex-col gap-16 border-l pl-24">
          {events.map((event, index) => (
            <li key={event.id} className="relative">
              <span
                aria-hidden
                className="border-void absolute top-20 -left-28 size-8 rounded-avatar border-2"
                style={{ background: eventMeta(event.event_type).cssVar }}
              />
              <EventCard event={event} compact index={index} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ── Industries ───────────────────────────────────────────────────────── */

function IndustrySection() {
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "industries"],
    queryFn: dashboardApi.industries,
  });

  const industries = data?.industries ?? [];
  if (!isPending && industries.length === 0) return null;

  return (
    <section>
      <SectionHeading title="Coverage by Industry" href="/companies" />
      {isPending ? (
        <div className="flex flex-col gap-12">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height="44px" />
          ))}
        </div>
      ) : (
        <IndustryBreakdownChart data={industries} />
      )}
    </section>
  );
}

/* ── Newsletter ───────────────────────────────────────────────────────── */

function NewsletterCTA() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("That doesn't look like an email address.");
      return;
    }
    setBusy(true);
    try {
      await newsletterApi.subscribe(email.trim());
      setDone(true);
    } catch (error) {
      toast.error(errorMessage(error, "Could not subscribe"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-surface border-border rounded-card border p-32 text-center">
      {done ? (
        <div className="animate-fade-in flex flex-col items-center">
          <CheckCircle2 className="text-signal-green size-32" aria-hidden />
          <h3 className="text-h3 text-text-primary mt-16">Check your inbox</h3>
          <p className="text-body-sm text-text-secondary mt-8">
            Confirm your address and the digest starts arriving on Mondays.
          </p>
        </div>
      ) : (
        <>
          <h3 className="text-h3 text-text-primary">Get the weekly hiring signal digest</h3>
          <p className="text-body-sm text-text-secondary mt-8">
            One email a Monday: who raised, who expanded, who started hiring.
          </p>
          <form onSubmit={submit} className="mx-auto mt-24 flex max-w-480 flex-col gap-8 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="bg-void border-border rounded-input text-body-sm text-text-primary focus:border-brand w-full border px-16 py-12 transition-colors duration-150 outline-none"
              />
            </label>
            <PillButton type="submit" disabled={busy}>
              {busy ? "Subscribing…" : "Subscribe"}
            </PillButton>
          </form>
        </>
      )}
    </section>
  );
}

/* ── Shared ───────────────────────────────────────────────────────────── */

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-24 flex items-baseline justify-between gap-16">
      <h2 className="text-h2 text-text-primary">{title}</h2>
      <Link
        to={href}
        className="text-mono text-brand hover:text-brand-light shrink-0 transition-colors duration-150"
      >
        View all →
      </Link>
    </div>
  );
}
