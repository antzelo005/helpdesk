import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { InfoCard as SharedInfoCard } from "../components/ui/InfoCard";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard as SharedStatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth, type CurrentUser } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { formatRoleLabel } from "../lib/format";
import type { Ticket, UserSummary } from "../lib/types";

export function DashboardPage() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agentCount, setAgentCount] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      return;
    }

    let active = true;

    const loadUser = async () => {
      setIsRefreshing(true);
      setErrorMessage("");
      try {
        await refreshCurrentUser();
      } catch {
        if (active) {
          setErrorMessage("Unable to load current user details from /auth/me/.");
        }
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, [currentUser, refreshCurrentUser]);

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      setIsLoadingStats(true);

      try {
        const { data: ticketData } = await api.get<Ticket[]>("tickets/");
        if (active) {
          setTickets(ticketData);
        }

        if (currentUser?.role === "ADMIN") {
          try {
            const { data: users } = await api.get<UserSummary[]>("users/");
            if (active) {
              setAgentCount(users.filter((user) => user.role === "AGENT").length);
            }
          } catch {
            if (active) {
              setAgentCount(null);
            }
          }
        }
      } catch (error) {
        if (active) {
          const message =
            error instanceof AxiosError
              ? "Unable to load dashboard statistics from the live API."
              : "Unable to load dashboard statistics.";
          setErrorMessage((current) => current || message);
          showToast(message, "error");
        }
      } finally {
        if (active) {
          setIsLoadingStats(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, [currentUser?.role]);

  const profile = currentUser as CurrentUser | null;
  const stats = useMemo(() => buildStats(tickets, currentUser?.role, agentCount), [tickets, currentUser?.role, agentCount]);
  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Dashboard"
        title="Current session overview"
        description="Live ticket metrics and recent activity are pulled from the API using your current role scope."
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {isLoadingStats
          ? Array.from({ length: stats.length || 4 }).map((_, index) => <MetricCardSkeleton key={index} />)
          : stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                description={stat.description}
              />
            ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        <HighlightsCard
          title="Response posture"
          body={
            currentUser?.role === "ADMIN"
              ? "Track team capacity, ticket ownership, and unresolved work from one view."
              : currentUser?.role === "AGENT"
                ? "Focus on assigned work, active investigations, and aging open tickets."
                : "Monitor your requests, recent updates, and anything still awaiting action."
          }
        />
        <HighlightsCard
          title="Queue visibility"
          body={`${tickets.length} ticket${tickets.length === 1 ? "" : "s"} currently visible in this session.`}
        />
        <HighlightsCard
          title="Queue health"
          body="Use this snapshot to spot unresolved work, pressure points, and whether the visible queue is trending clean or overloaded."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">Current user</p>
              <p className="mt-1 text-sm text-soft">Account summary from your current authenticated session.</p>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                setIsRefreshing(true);
                setErrorMessage("");
                try {
                  await refreshCurrentUser();
                  showToast("User details refreshed.", "success");
                } catch {
                  const message = "Refresh failed. Check the backend session.";
                  setErrorMessage(message);
                  showToast(message, "error");
                } finally {
                  setIsRefreshing(false);
                }
              }}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
              <span>{errorMessage}</span>
              <Button
                variant="secondary"
                onClick={async () => {
                  setErrorMessage("");
                  setIsLoadingStats(true);
                  try {
                    const { data: ticketData } = await api.get<Ticket[]>("tickets/");
                    setTickets(ticketData);
                    if (currentUser?.role === "ADMIN") {
                      const { data: users } = await api.get<UserSummary[]>("users/");
                      setAgentCount(users.filter((user) => user.role === "AGENT").length);
                    }
                  } catch {
                    const message = "Retry failed. Check the API connection.";
                    setErrorMessage(message);
                    showToast(message, "error");
                  } finally {
                    setIsLoadingStats(false);
                  }
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard label="Username" value={profile?.username} />
            <InfoCard label="Role" value={profile?.role ? formatRoleLabel(profile.role) : undefined} />
            <InfoCard label="Email" value={profile?.email || "No email set"} />
            <InfoCard
              label="Name"
              value={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Not provided"}
            />
          </dl>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">Recent tickets</p>
              <p className="text-soft mt-1 text-sm">Latest items from your visible queue.</p>
            </div>
            <Link to="/tickets" className="button-secondary px-5 py-3">
              Open queue
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {isLoadingStats ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} muted className="p-4">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="mt-3 h-4 w-3/4" />
                  <div className="mt-4 flex gap-2">
                    <LoadingSkeleton className="h-7 w-24 rounded-full" />
                    <LoadingSkeleton className="h-7 w-20 rounded-full" />
                  </div>
                </Card>
              ))
            ) : recentTickets.length ? (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="surface-muted block rounded-2xl border px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{ticket.title}</p>
                      <p className="text-soft mt-1 text-sm">
                        {ticket.category.name} - {ticket.created_by.username}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge kind="status" value={ticket.status} />
                      <StatusBadge kind="priority" value={ticket.priority} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyQueueState message="Your current queue is empty." />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | number | null }) {
  return <SharedInfoCard label={label} value={value} />;
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <SharedStatCard
      label={label}
      value={typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      description={description}
      meta={typeof value === "number" ? "Live" : "Info"}
    />
  );
}

function HighlightsCard({ title, body }: { title: string; body: string }) {
  return (
    <Card soft className="p-6">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-soft mt-3 text-sm leading-7">{body}</p>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="min-h-[196px] p-6">
      <div className="flex items-start justify-between gap-4">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-4 w-10 rounded-xl" />
      </div>
      <LoadingSkeleton className="mt-6 h-12 w-24" />
      <LoadingSkeleton lines={2} className="mt-4" />
    </Card>
  );
}

function EmptyQueueState({ message }: { message: string }) {
  return <EmptyState title="No recent tickets" message={message} />;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 700;
    const start = performance.now();

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue}</>;
}

function buildStats(tickets: Ticket[], role?: CurrentUser["role"], agentCount?: number | null) {
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const inProgressTickets = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
  const resolvedClosedTickets = tickets.filter((ticket) =>
    ticket.status === "RESOLVED" || ticket.status === "CLOSED"
  ).length;
  const highPriorityTickets = tickets.filter((ticket) => ticket.priority === "HIGH").length;

  if (role === "ADMIN") {
    const unassignedTickets = tickets.filter((ticket) => !ticket.assigned_to).length;
    return [
      { label: "Total tickets", value: totalTickets, description: "All visible tickets across the helpdesk." },
      { label: "Open", value: openTickets, description: "Tickets waiting for the first workflow action." },
      { label: "In progress", value: inProgressTickets, description: "Tickets currently being handled." },
      { label: "Resolved / closed", value: resolvedClosedTickets, description: "Completed tickets in the queue." },
      { label: "High priority", value: highPriorityTickets, description: "Tickets marked with elevated urgency." },
      { label: "Unassigned", value: unassignedTickets, description: "Tickets not yet owned by an agent." },
      { label: "Agents", value: agentCount ?? "N/A", description: "Agent accounts available in the system." },
    ];
  }

  if (role === "AGENT") {
    const requiringAction = tickets.filter(
      (ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
    ).length;
    return [
      { label: "Assigned tickets", value: totalTickets, description: "Tickets currently assigned to you." },
      { label: "Open", value: openTickets, description: "Assigned tickets not started yet." },
      { label: "In progress", value: inProgressTickets, description: "Assigned tickets actively being worked." },
      { label: "Resolved / closed", value: resolvedClosedTickets, description: "Assigned tickets already completed." },
      { label: "High priority", value: highPriorityTickets, description: "Assigned tickets needing higher urgency." },
      { label: "Requiring action", value: requiringAction, description: "Assigned tickets still awaiting closure." },
    ];
  }

  const ownOpenTickets = tickets.filter(
    (ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
  ).length;
  const ownResolvedTickets = tickets.filter(
    (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED"
  ).length;

  return [
    { label: "My tickets", value: totalTickets, description: "Tickets you have created in the system." },
    { label: "Open", value: ownOpenTickets, description: "Your tickets that still need support work." },
    { label: "Resolved", value: ownResolvedTickets, description: "Your tickets that have been completed." },
    { label: "High priority", value: highPriorityTickets, description: "Your tickets marked as high urgency." },
  ];
}
