import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { CreateTicketModal } from "../components/tickets/CreateTicketModal";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Ticket, TicketCategory } from "../lib/types";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH"] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];
type PriorityFilter = (typeof PRIORITY_OPTIONS)[number];

export function TicketsPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
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

  const ticketCountSummary = useMemo(() => {
    if (isLoading) {
      return "Loading tickets...";
    }
    if (!tickets.length) {
      return "No tickets match the current filters.";
    }
    return `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} loaded`;
  }, [isLoading, tickets.length]);

  return (
    <div className="space-y-4">
      <section className="panel p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-signal">Tickets</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
              Ticket operations are now wired into the live API.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Browse the ticket queue, narrow it by status or priority, and create new tickets
              as a client without leaving the portal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-3xl bg-teal-50 px-5 py-4 text-sm font-medium text-teal-900">
              Signed in as {currentUser?.username ?? "Unknown"} ({currentUser?.role ?? "Unknown"})
            </div>
            {currentUser?.role === "CLIENT" ? (
              <button type="button" className="button-primary" onClick={() => setIsCreateOpen(true)}>
                Create ticket
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Queue status" body={ticketCountSummary} />
        <Card
          title="Role scope"
          body={
            currentUser?.role === "CLIENT"
              ? "Clients see only their own tickets and can open new ones."
              : currentUser?.role === "AGENT"
                ? "Agents see tickets assigned to them and can monitor their workload."
                : "Admins see the full queue and all available ticket metadata."
          }
        />
        <Card
          title="Categories"
          body={
            isCategoriesLoading
              ? "Loading categories..."
              : `${categories.length} categories available for ticket classification.`
          }
        />
      </section>

      <section className="panel p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ticket filters</p>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the list using backend-supported status and priority query parameters.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="mt-6 h-20 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : tickets.length ? (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-slate-200 xl:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Created by</th>
                      <th className="px-6 py-4">Assigned to</th>
                      <th className="px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="align-top text-sm text-slate-700">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">{ticket.title}</p>
                          <p className="mt-2 line-clamp-2 max-w-md text-sm leading-6 text-slate-500">
                            {ticket.description}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge tone={statusTone(ticket.status)}>{formatEnum(ticket.status)}</Badge>
                        </td>
                        <td className="px-6 py-5">
                          <Badge tone={priorityTone(ticket.priority)}>{formatEnum(ticket.priority)}</Badge>
                        </td>
                        <td className="px-6 py-5">{ticket.category.name}</td>
                        <td className="px-6 py-5">{ticket.created_by.username}</td>
                        <td className="px-6 py-5">{ticket.assigned_to?.username ?? "Unassigned"}</td>
                        <td className="px-6 py-5">{formatDate(ticket.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{ticket.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={statusTone(ticket.status)}>{formatEnum(ticket.status)}</Badge>
                        <Badge tone={priorityTone(ticket.priority)}>{formatEnum(ticket.priority)}</Badge>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <MetaItem label="Category" value={ticket.category.name} />
                      <MetaItem label="Created by" value={ticket.created_by.username} />
                      <MetaItem label="Assigned to" value={ticket.assigned_to?.username ?? "Unassigned"} />
                      <MetaItem label="Created" value={formatDate(ticket.created_at)} />
                    </dl>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">No tickets found</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Try adjusting the filters or create a new ticket if you are signed in as a client.
              </p>
              {currentUser?.role === "CLIENT" ? (
                <button
                  type="button"
                  className="button-primary mt-6"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create your first ticket
                </button>
              ) : (
                <Link to="/dashboard" className="button-secondary mt-6">
                  Back to dashboard
                </Link>
              )}
            </div>
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

function Card({ title, body }: { title: string; body: string }) {
  return (
    <article className="panel p-6">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
    </article>
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
      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="field min-w-44" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? `All ${label.toLowerCase()}` : formatEnum(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${tone}`}>
      {children}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: Ticket["status"]) {
  switch (status) {
    case "OPEN":
      return "bg-sky-100 text-sky-800";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800";
    case "CLOSED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityTone(priority: Ticket["priority"]) {
  switch (priority) {
    case "HIGH":
      return "bg-rose-100 text-rose-800";
    case "MEDIUM":
      return "bg-orange-100 text-orange-800";
    case "LOW":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
