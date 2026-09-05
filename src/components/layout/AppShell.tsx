import { useEffect, useState } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

import { SignInModal } from "@/components/auth/SignInModal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SearchModal } from "@/components/ui/SearchModal";
import { ToastContainer } from "@/components/ui/Toast";
import { CrawlBudgetBanner } from "./CrawlBudgetBanner";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => setSearchOpen(false), [location.pathname]);

  return (
    <div className="bg-void text-text-primary flex min-h-screen flex-col">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />

      <main className="mx-auto w-full max-w-layout flex-1 px-16 pt-nav sm:px-24">
        {/* Above the error boundary on purpose: if a page crashes, the reason
            new data stopped arriving is still worth showing. */}
        <div className="pt-24">
          <CrawlBudgetBanner />
        </div>
        {/* Keyed to the path so a crash on one route clears when you leave it. */}
        <ErrorBoundary key={location.pathname} label="page">
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SignInModal />
      <ToastContainer />
      <ScrollRestoration />
    </div>
  );
}
