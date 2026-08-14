import { Link } from "react-router-dom";

const REPO_URL = "https://github.com/varuntripathi-029/get_job_be";

/** Where a company asks for a correction or removal. A public, monitored
 * channel is the point — a takedown route nobody can find is the same as not
 * having one. Override with VITE_CONTACT_EMAIL to use a mailbox instead. */
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
const CONTACT_URL = CONTACT_EMAIL
  ? `mailto:${CONTACT_EMAIL}`
  : `${REPO_URL}/issues/new`;

const INTERNAL_LINKS = [{ label: "Sources", to: "/sources" }];

export function Footer() {
  return (
    <footer className="border-border mt-64 border-t">
      <div className="mx-auto max-w-layout px-16 py-32 sm:px-24">
        <div className="flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-mono-sm text-text-muted">
            Powered by public signals. Not a job board. Not predictions.
          </p>
          <nav className="flex gap-20">
            {INTERNAL_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-mono-sm text-text-muted hover:text-text-secondary transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
            {/* A plain anchor, not a router Link: Link renders href="/…" and
                would keep an external URL on this origin. */}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-mono-sm text-text-muted hover:text-text-secondary transition-colors duration-150"
            >
              GitHub
            </a>
          </nav>
        </div>

        <Disclaimer />
      </div>
    </footer>
  );
}

/**
 * Attribution and scope-of-use notice.
 *
 * Every claim here has to stay true of what the crawler actually does, because
 * the notice is worth nothing — worse than nothing — if the behaviour it
 * describes and the behaviour in workers/crawl.py diverge.
 */
function Disclaimer() {
  return (
    <div className="border-border mt-24 border-t pt-24">
      <h2 className="text-mono-sm text-text-secondary mb-12 uppercase">
        Attribution &amp; disclaimer
      </h2>

      <div className="text-mono-xs text-text-muted flex flex-col gap-8 leading-relaxed">
        <p>
          HireSignal is an independent, non-commercial project. It is not
          affiliated with, endorsed by, or sponsored by any company, employer or
          data provider named on this site.
        </p>

        <p>
          Company and product names, logos and trademarks are the property of
          their respective owners. They are used here only to identify the
          organisation a signal refers to — nominative reference, not a claim of
          ownership, partnership or approval.
        </p>

        <p>
          Information is compiled from publicly accessible sources: company
          career pages and blogs, public job-board APIs, RSS feeds and news
          search. Nothing behind a login, paywall or access control is
          collected. Every signal on this site links to the source it came from,
          so the original publisher gets the visit and the credit.
        </p>

        <p>
          Job listings link to the employer&apos;s own posting. HireSignal does
          not host applications, reproduce full job descriptions, or present
          itself as the source of any listing. Momentum scores are automated
          inferences drawn from public activity — they are opinion, not
          statements of fact, and they are never a claim about any
          company&apos;s actual hiring plans, finances or intentions.
        </p>

        <p>
          If you represent an organisation and want a source removed, a signal
          corrected, or your site excluded from crawling,{" "}
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-brand hover:text-brand-light underline transition-colors duration-150"
          >
            get in touch
          </a>{" "}
          and it will be actioned promptly and without argument.
        </p>

        <p className="text-text-muted/80">
          Provided as-is, with no warranty as to accuracy or completeness. Do not
          rely on it as the sole basis for an employment or financial decision.
        </p>
      </div>
    </div>
  );
}
