import { LayoutGrid, LogOut, Menu, Radar, Search, Shield, Upload, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { Dropdown } from "@/components/ui/Dropdown";
import { PillButton } from "@/components/ui/PillButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { cn, initialOf } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/companies", label: "Companies" },
  { to: "/jobs", label: "Jobs" },
  { to: "/events", label: "Events" },
];

interface NavbarProps {
  onOpenSearch: () => void;
}

export function Navbar({ onOpenSearch }: NavbarProps) {
  const { isAuthenticated, isAdmin, user, signOut, promptSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  // The underline is positioned from the live DOM rather than computed from
  // label lengths, so it stays correct once the webfont swaps in.
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>("[data-active='true']");
    if (!active) {
      setIndicator((current) => ({ ...current, visible: false }));
      return;
    }
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth, visible: true });
  }, []);

  useLayoutEffect(measure, [measure, location.pathname]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // A route change should never leave the drawer hanging open behind the page.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const accountItems = [
    { label: "My Resume", icon: <Upload className="size-14" />, onClick: () => navigate("/resume") },
    {
      label: "My Submissions",
      icon: <LayoutGrid className="size-14" />,
      onClick: () => navigate("/submissions"),
    },
    ...(isAdmin
      ? [{ label: "Admin", icon: <Shield className="size-14" />, onClick: () => navigate("/admin") }]
      : []),
    { label: "", divider: true },
    { label: "Sign Out", icon: <LogOut className="size-14" />, onClick: signOut, danger: true },
  ];

  return (
    <>
      <header className="glass border-border z-sticky fixed inset-x-0 top-0 border-x-0 border-t-0 border-b">
        <div className="mx-auto flex h-nav max-w-layout items-center gap-16 px-16 sm:px-24">
          {/* Wordmark */}
          <Link to="/" className="flex shrink-0 items-center gap-8">
            <Radar className="text-brand size-20" aria-hidden />
            <span className="text-h3 text-text-primary font-semibold">
              Hire<span className="text-brand">Signal</span>
            </span>
          </Link>

          {/* Primary nav — desktop */}
          <nav ref={listRef} className="relative ml-24 hidden h-full items-center gap-24 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                data-active={location.pathname.startsWith(link.to)}
                className={({ isActive }) =>
                  cn(
                    "text-mono flex h-full items-center transition-colors duration-200",
                    isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <span
              aria-hidden
              className={cn(
                "bg-brand absolute bottom-0 block h-2 transition-all duration-200 ease-out",
                !indicator.visible && "opacity-0",
              )}
              style={{ left: indicator.left, width: indicator.width }}
            />
          </nav>

          <div className="flex-1" />

          {/* Actions */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search (Ctrl+K)"
            title="Search  ⌘K"
            className="text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-pill p-8 transition-colors duration-150"
          >
            <Search className="size-16" aria-hidden />
          </button>

          <ThemeToggle className="hidden sm:block" />

          {isAuthenticated && user ? (
            <Dropdown
              triggerLabel="Account menu"
              className="hidden md:block"
              trigger={
                user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="rounded-avatar size-32 object-cover"
                  />
                ) : (
                  <span className="bg-brand text-text-on-brand rounded-avatar text-mono-lg flex size-32 items-center justify-center">
                    {initialOf(user.name || user.email)}
                  </span>
                )
              }
              items={accountItems}
            />
          ) : (
            /* max-md:hidden, not "hidden md:inline-flex": the pill's own
               inline-flex is emitted after .hidden in the sheet and would win.
               A variant rule sorts later, so it takes precedence cleanly. */
            <PillButton size="sm" className="max-md:hidden" onClick={promptSignIn}>
              Sign In
            </PillButton>
          )}

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="text-text-secondary hover:text-text-primary p-8 md:hidden"
          >
            <Menu className="size-20" aria-hidden />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="z-overlay fixed inset-0 md:hidden">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "var(--backdrop-modal)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <nav
            aria-label="Main menu"
            className="glass-strong border-border animate-slide-in-left absolute inset-y-0 left-0 flex w-280 max-w-full flex-col overflow-y-auto border-r p-24"
          >
            <div className="flex items-center justify-between">
              <span className="text-h3 text-text-primary font-semibold">
                Hire<span className="text-brand">Signal</span>
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="text-text-muted hover:text-text-primary p-4"
              >
                <X className="size-18" aria-hidden />
              </button>
            </div>

            <div className="mt-32 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "text-mono rounded-input px-12 py-12 transition-colors duration-150",
                      isActive
                        ? "bg-brand-10 text-brand"
                        : "text-text-secondary hover:bg-surface-raised hover:text-text-primary",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/sources"
                className={({ isActive }) =>
                  cn(
                    "text-mono rounded-input px-12 py-12 transition-colors duration-150",
                    isActive
                      ? "bg-brand-10 text-brand"
                      : "text-text-secondary hover:bg-surface-raised hover:text-text-primary",
                  )
                }
              >
                Sources
              </NavLink>
            </div>

            <div className="bg-border my-24 h-px" />

            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                {accountItems
                  .filter((item) => !item.divider)
                  .map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        item.onClick?.();
                      }}
                      className={cn(
                        "text-mono rounded-input hover:bg-surface-raised flex items-center gap-8 px-12 py-12 text-left transition-colors duration-150",
                        item.danger ? "text-signal-red" : "text-text-secondary",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
              </div>
            ) : (
              <PillButton
                onClick={() => {
                  setDrawerOpen(false);
                  promptSignIn();
                }}
              >
                Sign In
              </PillButton>
            )}

            <div className="mt-auto flex items-center justify-between pt-24">
              <span className="text-mono-sm text-text-muted">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
