import { Radar } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

import { pillClasses } from "@/components/ui/PillButton";
import { setPageTitle } from "@/lib/utils";

export function NotFoundPage() {
  useEffect(() => setPageTitle("Not found"), []);

  return (
    <div className="min-h-panel flex flex-col items-center justify-center py-64 text-center">
      <Radar className="text-text-muted size-48" strokeWidth={1.25} aria-hidden />
      <h1 className="text-h1 text-text-primary mt-24">No signal here</h1>
      <p className="text-body-sm text-text-secondary mt-8 max-w-420">
        That page doesn't exist. It may have moved, or the link may be wrong.
      </p>
      <Link to="/" className={pillClasses({ className: "mt-32" })}>
        Back to home
      </Link>
    </div>
  );
}
