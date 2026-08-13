import { Link } from "react-router-dom";

const LINKS = [
  { label: "About", to: "/sources" },
  { label: "API Docs", to: "#" },
  { label: "GitHub", to: "#" },
];

export function Footer() {
  return (
    <footer className="border-border mt-64 border-t">
      <div className="mx-auto flex max-w-layout flex-col gap-12 px-16 py-32 sm:flex-row sm:items-center sm:justify-between sm:px-24">
        <p className="text-mono-sm text-text-muted">
          Powered by public signals. Not a job board. Not predictions.
        </p>
        <nav className="flex gap-20">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-mono-sm text-text-muted hover:text-text-secondary transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
