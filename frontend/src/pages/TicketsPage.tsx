import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { CreateTicketModal } from "../components/tickets/CreateTicketModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { InfoCard } from "../components/ui/InfoCard";
import { Input, Select } from "../components/ui/Input";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { formatDateTime, formatEnum, formatRoleLabel } from "../lib/format";
import type { Ticket, TicketCategory } from "../lib/types";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH"] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];
type PriorityFilter = (typeof PRIORITY_OPTIONS)[number];
type SortKey = "title" | "status" | "priority" | "category" | "created_by" | "assigned_to" | "created_at";
type SortDirection = "asc" | "desc";

export function TicketsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(parseStatus(searchParams.get("status")));
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(parsePriority(searchParams.get("priority")));
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>(parseSortKey(searchParams.get("sort")));
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    searchParams.get("dir") === "asc" ? "asc" : "desc",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const { data } = await api.get<TicketCategory[]>("categories/");
      setCategories(data);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      if (priorityFilter !== "ALL") {
        params.priority = priorityFilter;
      }

      const { data } = await api.get<Ticket[]>("tickets/", { params });
      setTickets(data);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? "Unable to load tickets from the API. Check that the backend is running and your token is valid."
          : "Unable to load tickets.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }
    if (priorityFilter !== "ALL") {
      params.set("priority", priorityFilter);
    }
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    if (sortKey !== "created_at") {
      params.set("sort", sortKey);
    }
    if (sortDirection !== "desc") {
      params.set("dir", sortDirection);
    }
    setSearchParams(params, { replace: true });
  }, [priorityFilter, searchQuery, setSearchParams, sortDirection, sortKey, statusFilter]);

  const ticketCountSummary = useMemo(() => {
    if (isLoading) {
      return "Loading tickets...";
    }
    if (!tickets.length) {
      return "No tickets match the current filters.";
    }
    return `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} loaded`;
  }, [isLoading, tickets.length]);

  const visibleTickets = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    const filteredTickets = normalizedQuery
      ? tickets.filter((ticket) =>
          [
            ticket.title,
            ticket.description,
            ticket.category.name,
            ticket.created_by.username,
            ticket.assigned_to?.username ?? "",
            formatEnum(ticket.status),
            formatEnum(ticket.priority),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : tickets;

    return [...filteredTickets].sort((left, right) =>
      compareTickets(left, right, sortKey, sortDirection),
    );
  }, [searchQuery, sortDirection, sortKey, tickets]);

  const setSort = (column: SortKey) => {
    setSortKey((currentKey) => {
      if (currentKey === column) {
        setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
        return currentKey;
      }

      setSortDirection(column === "created_at" ? "desc" : "asc");
      return column;
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Tickets"
        title="Ticket operations"
        description="Browse the ticket queue, narrow it by status or priority, and create new tickets as a client without leaving the portal."
        aside={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Badge tone="accent">
              {currentUser?.username ?? "Unknown"} · {formatRoleLabel(currentUser?.role ?? "CLIENT")}
            </Badge>
            {currentUser?.role === "CLIENT" ? (
              <Button type="button" onClick={() => setIsCreateOpen(true)}>
                Create ticket
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Queue status" body={ticketCountSummary} />
        <SummaryCard
          title="Role scope"
          body={
            currentUser?.role === "CLIENT"
              ? "Clients see only their own tickets and can open new ones."
              : currentUser?.role === "AGENT"
                ? "Agents see tickets assigned to them and can monitor their workload."
                : "Admins see the full queue and all available ticket metadata."
          }
        />
        <SummaryCard
          title="Categories"
          body={
            isCategoriesLoading
              ? "Loading categories..."
              : `${categories.length} categories available for ticket classification.`
          }
        />
      </section>

      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Ticket filters</p>
            <p className="mt-1 text-sm text-soft">
              Narrow the list using backend-supported status and priority query parameters plus client-side search and sorting.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(14rem,1.2fr)_repeat(2,minmax(10rem,1fr))]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="search-tickets">
                Search
              </label>
              <Input
                id="search-tickets"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search title, description, user, or category"
              />
            </div>
            <FilterSelect
              id="status-filter"
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={STATUS_OPTIONS}
            />
            <FilterSelect
              id="priority-filter"
              label="Priority"
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as PriorityFilter)}
              options={PRIORITY_OPTIONS}
            />
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorMessage}</span>
            <Button variant="secondary" onClick={() => void loadTickets()}>
              Retry
            </Button>
          </div>
        ) : null}

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} muted className="p-6">
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="mt-4 h-6 w-2/3" />
                  <LoadingSkeleton className="mt-6 h-20 rounded-2xl" />
                </Card>
              ))}
            </div>
          ) : visibleTickets.length ? (
            <>
              <div className="table-shell hidden overflow-hidden rounded-3xl border xl:block">
                <table className="min-w-full divide-y divide-[color:var(--color-border)]">
                  <thead className="table-head">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                      <SortableHeader label="Title" column="title" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                      <SortableHeader label="Status" column="status" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                      <SortableHeader label="Priority" column="priority" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                      <SortableHeader label="Category" column="category" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                      <SortableHeader label="Created by" column="created_by" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                      <SortableHeader label="Assigned to" column="assigned_to" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                      <SortableHeader label="Created" column="created_at" sortKey={sortKey} sortDirection={sortDirection} onSortChange={setSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]">
                    {visibleTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="table-row cursor-pointer align-top text-sm transition-colors focus-within:bg-[color:var(--color-primary-soft-2)]"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-ink">{ticket.title}</p>
                          <p className="text-soft mt-2 line-clamp-2 max-w-md text-sm leading-6">
                            {ticket.description}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge kind="status" value={ticket.status} />
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge kind="priority" value={ticket.priority} />
                        </td>
                        <td className="px-6 py-5">{ticket.category.name}</td>
                        <td className="px-6 py-5">{ticket.created_by.username}</td>
                        <td className="px-6 py-5">{ticket.assigned_to?.username ?? "Unassigned"}</td>
                        <td className="px-6 py-5">{formatDateTime(ticket.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {visibleTickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="cursor-pointer rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-5 shadow-sm transition hover:border-[color:var(--color-border-strong)] sm:p-6"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-ink">{ticket.title}</p>
                        <p className="text-soft mt-2 text-sm leading-6">{ticket.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge kind="status" value={ticket.status} />
                        <StatusBadge kind="priority" value={ticket.priority} />
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <MetaItem label="Category" value={ticket.category.name} />
                      <MetaItem label="Created by" value={ticket.created_by.username} />
                      <MetaItem label="Assigned to" value={ticket.assigned_to?.username ?? "Unassigned"} />
                      <MetaItem label="Created" value={formatDateTime(ticket.created_at)} />
                    </dl>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No tickets found"
              message="Try adjusting the filters or search, or create a new ticket if you are signed in as a client."
              action={
                currentUser?.role === "CLIENT" ? (
                  <Button type="button" onClick={() => setIsCreateOpen(true)}>
                    Create your first ticket
                  </Button>
                ) : (
                  <Link to="/dashboard" className="button-secondary px-5 py-3">
                    Back to dashboard
                  </Link>
                )
              }
            />
          )}
        </div>
      </section>

      <CreateTicketModal
        categories={categories}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadTickets}
      />
    </div>
  );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="text-soft mt-3 text-sm leading-7">{body}</p>
    </Card>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      <Select id={id} className="min-w-44" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? `All ${label.toLowerCase()}` : formatEnum(option)}
          </option>
        ))}
      </Select>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return <InfoCard label={label} value={value} soft className="px-4 py-4" />;
}

function SortableHeader({
  label,
  column,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (column: SortKey) => void;
}) {
  const isActive = sortKey === column;

  return (
    <th className="px-6 py-4">
      <button
        type="button"
        className="inline-flex items-center gap-2 font-semibold transition-colors hover:text-blue-800"
        onClick={() => onSortChange(column)}
      >
        {label}
        <span className={isActive ? "text-blue-700" : "text-blue-300"}>
          {isActive ? (sortDirection === "asc" ? "^" : "v") : "<>"}
        </span>
      </button>
    </th>
  );
}

function compareTickets(left: Ticket, right: Ticket, sortKey: SortKey, sortDirection: SortDirection) {
  const order = sortDirection === "asc" ? 1 : -1;
  const leftValue = getSortValue(left, sortKey);
  const rightValue = getSortValue(right, sortKey);

  if (leftValue < rightValue) {
    return -1 * order;
  }
  if (leftValue > rightValue) {
    return 1 * order;
  }
  return 0;
}

function getSortValue(ticket: Ticket, sortKey: SortKey) {
  switch (sortKey) {
    case "title":
      return ticket.title.toLowerCase();
    case "status":
      return formatEnum(ticket.status);
    case "priority":
      return formatEnum(ticket.priority);
    case "category":
      return ticket.category.name.toLowerCase();
    case "created_by":
      return ticket.created_by.username.toLowerCase();
    case "assigned_to":
      return ticket.assigned_to?.username.toLowerCase() ?? "";
    case "created_at":
      return new Date(ticket.created_at).getTime();
    default:
      return "";
  }
}

function parseStatus(value: string | null): StatusFilter {
  return STATUS_OPTIONS.includes(value as StatusFilter) ? (value as StatusFilter) : "ALL";
}

function parsePriority(value: string | null): PriorityFilter {
  return PRIORITY_OPTIONS.includes(value as PriorityFilter) ? (value as PriorityFilter) : "ALL";
}

function parseSortKey(value: string | null): SortKey {
  const sortKeys: SortKey[] = [
    "title",
    "status",
    "priority",
    "category",
    "created_by",
    "assigned_to",
    "created_at",
  ];
  return sortKeys.includes(value as SortKey) ? (value as SortKey) : "created_at";
}
