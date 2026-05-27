import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { formatRoleLabel } from "../../lib/format";
import type { Ticket } from "../../lib/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tickets", label: "Tickets" },
  { to: "/settings", label: "Settings" },
];

const THEME_STORAGE_KEY = "helpdesk-theme";
const UTILITY_PANEL_STORAGE_KEY = "helpdesk-utility-panel-hidden";

export function AppShell() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"helpdesk-light" | "helpdesk-dark">(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "helpdesk-dark" ? "helpdesk-dark" : "helpdesk-light";
  });
  const [isUtilityPanelHidden, setIsUtilityPanelHidden] = useState<boolean>(() => {
    return window.localStorage.getItem(UTILITY_PANEL_STORAGE_KEY) === "true";
  });
  const [visibleTickets, setVisibleTickets] = useState<Ticket[]>([]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(UTILITY_PANEL_STORAGE_KEY, String(isUtilityPanelHidden));
  }, [isUtilityPanelHidden]);

  useEffect(() => {
    let active = true;

    const loadUtilityData = async () => {
      try {
        const { data } = await api.get<Ticket[]>("tickets/");
        if (active) {
          setVisibleTickets(data);
        }
      } catch {
        if (active) {
          setVisibleTickets([]);
        }
      }
    };

    void loadUtilityData();
    return () => {
      active = false;
    };
  }, [currentUser?.role]);

  const queueSummary = useMemo(() => {
    const open = visibleTickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgress = visibleTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    return { total: visibleTickets.length, open, inProgress };
  }, [visibleTickets]);

  const recentActivity = useMemo(() => visibleTickets.slice(0, 3), [visibleTickets]);

  return (
    <div className="min-h-screen bg-mesh-soft px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1800px] flex-col gap-4 lg:flex-row">
        <aside
          className={[
            "panel flex w-full flex-col justify-between p-6 xl:w-[19rem]",
            isMobileMenuOpen ? "max-lg:pb-6" : "",
          ].join(" ")}
        >
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-signal to-navy text-sm font-bold text-white shadow-lg shadow-blue-200/70">
                  HD
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    HelpDesk
                  </p>
                  <h1 className="text-2xl font-extrabold text-ink">Control Center</h1>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                aria-expanded={isMobileMenuOpen}
                aria-controls="app-navigation"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              >
                {isMobileMenuOpen ? "Close" : "Menu"}
              </Button>
            </div>

            <Card soft className="mt-8 px-5 py-6">
              <p className="text-xs uppercase tracking-[0.24em] text-accent">Signed in</p>
              <p className="mt-3 text-lg font-semibold text-ink">{currentUser?.username ?? "Loading..."}</p>
              <p className="text-soft text-sm">{currentUser?.email || "No email set"}</p>
              <span className="badge-soft mt-4 bg-[color:var(--color-surface-strong)] text-accent shadow-sm">
                {formatRoleLabel(currentUser?.role ?? "CLIENT")}
              </span>
            </Card>

            <nav
              id="app-navigation"
              className={[
                "mt-8 space-y-2",
                isMobileMenuOpen ? "block" : "hidden lg:block",
              ].join(" ")}
            >
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive ? "nav-active" : "nav-idle",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <Button type="button" onClick={handleLogout} variant="secondary" className="mt-8 w-full">
            Logout
          </Button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="panel mb-4 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Workspace</p>
                <p className="mt-2 text-sm text-soft">
                  Global controls and account context stay available without changing the route structure.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="accent">
                  Role: {formatRoleLabel(currentUser?.role ?? "CLIENT")}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden xl:inline-flex"
                  onClick={() => setIsUtilityPanelHidden((current) => !current)}
                >
                  {isUtilityPanelHidden ? "Show tools" : "Hide tools"}
                </Button>
              </div>
            </div>
          </header>

          <div
            className={[
              "grid gap-4",
              isUtilityPanelHidden ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_20rem]",
            ].join(" ")}
          >
            <Outlet />

            {!isUtilityPanelHidden ? (
              <aside className="hidden xl:block">
                <Card className="sticky top-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Utility panel</p>
                      <p className="text-soft mt-1 text-xs">Desktop-only workspace shortcuts.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsUtilityPanelHidden(true)}>
                      Hide
                    </Button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <Card muted className="px-4 py-4">
                      <p className="text-muted text-xs font-semibold uppercase tracking-[0.22em]">Visible queue</p>
                      <div className="mt-3 grid gap-3">
                        <MetricMini label="Total" value={String(queueSummary.total)} />
                        <MetricMini label="Open" value={String(queueSummary.open)} />
                        <MetricMini label="In progress" value={String(queueSummary.inProgress)} />
                      </div>
                    </Card>

                    <Card soft className="px-4 py-4">
                      <p className="text-muted text-xs font-semibold uppercase tracking-[0.22em]">Theme</p>
                      <button
                        type="button"
                        className="theme-toggle mt-3 w-full justify-between"
                        role="switch"
                        aria-checked={theme === "helpdesk-dark"}
                        aria-label="Toggle theme"
                        onClick={() =>
                          setTheme((current) =>
                            current === "helpdesk-light" ? "helpdesk-dark" : "helpdesk-light",
                          )
                        }
                      >
                        <span className="theme-toggle-track">
                          <span className="theme-toggle-thumb" />
                        </span>
                        <span className="text-sm font-semibold text-ink">
                          {theme === "helpdesk-light" ? "Light mode" : "Dark mode"}
                        </span>
                      </button>
                    </Card>

                    <Card muted className="px-4 py-4">
                      <p className="text-muted text-xs font-semibold uppercase tracking-[0.22em]">Recent activity</p>
                      <div className="mt-3 space-y-3">
                        {recentActivity.length ? (
                          recentActivity.map((ticket) => (
                            <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block rounded-2xl border border-[color:var(--color-border)] px-3 py-3 transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-strong)]">
                              <p className="truncate text-sm font-semibold text-ink">{ticket.title}</p>
                              <p className="mt-1 text-xs text-soft">{ticket.category.name}</p>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-soft">No recent ticket activity visible.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                </Card>
              </aside>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-3">
      <span className="text-sm text-soft">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
