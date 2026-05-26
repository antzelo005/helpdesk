import { AxiosError } from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Ticket, TicketComment, UserSummary } from "../lib/types";

const STATUS_OPTIONS: Ticket["status"][] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [agents, setAgents] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [statusDraft, setStatusDraft] = useState<Ticket["status"]>("OPEN");
  const [assignedDraft, setAssignedDraft] = useState<string>("");

  const isAgent = currentUser?.role === "AGENT";
  const isAdmin = currentUser?.role === "ADMIN";

  const loadTicket = async () => {
    if (!ticketId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [{ data: ticketData }, commentsResponse] = await Promise.all([
        api.get<Ticket>(`tickets/${ticketId}/`),
        api.get<TicketComment[]>("comments/", { params: { ticket: ticketId } }).catch(() => null),
      ]);

      setTicket(ticketData);
      setStatusDraft(ticketData.status);
      setAssignedDraft(ticketData.assigned_to ? String(ticketData.assigned_to.id) : "");
      setComments(commentsResponse?.data ?? ticketData.comments ?? []);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? "Unable to load ticket details. Check the ticket access rules and backend API."
          : "Unable to load ticket details.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgents = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const { data } = await api.get<UserSummary[]>("users/");
      setAgents(data.filter((user) => user.role === "AGENT"));
    } catch {
      setAgents([]);
    }
  };

  useEffect(() => {
    void loadTicket();
  }, [ticketId]);

  useEffect(() => {
    void loadAgents();
  }, [isAdmin]);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ticketId || !commentBody.trim()) {
      return;
    }

    setCommentError("");
    setIsSubmittingComment(true);

    try {
      const { data } = await api.post<TicketComment>("comments/", {
        ticket_id: Number(ticketId),
        body: commentBody.trim(),
      });
      setComments((current) => [...current, data]);
      setCommentBody("");
    } catch {
      setCommentError("Unable to post the comment. Verify your access to this ticket.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTicketUpdate = async () => {
    if (!ticketId) {
      return;
    }

    setIsSavingTicket(true);
    setErrorMessage("");

    try {
      const payload: Record<string, string | number | null> = { status: statusDraft };
      if (isAdmin) {
        payload.assigned_to_id = assignedDraft ? Number(assignedDraft) : null;
      }
      await api.patch(`tickets/${ticketId}/`, payload);
      await loadTicket();
    } catch {
      setErrorMessage("Unable to save ticket updates. Check your role permissions.");
    } finally {
      setIsSavingTicket(false);
    }
  };

  const canUpdateTicket = Boolean(ticket && (isAgent || isAdmin));
  const attachmentCount = ticket?.attachments.length ?? 0;

  const timelineSummary = useMemo(() => {
    if (!ticket) {
      return "Loading timeline...";
    }
    return `${comments.length} comment${comments.length === 1 ? "" : "s"} and ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`;
  }, [attachmentCount, comments.length, ticket]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <section className="panel p-8 lg:p-10">
          <div className="h-4 w-28 animate-pulse rounded bg-blue-100" />
          <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-blue-100" />
          <div className="mt-6 h-24 animate-pulse rounded-3xl bg-slate-100" />
        </section>
      </div>
    );
  }

  if (!ticket) {
    return (
      <section className="panel p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">Ticket unavailable</p>
        <p className="text-soft mt-2 text-sm">{errorMessage || "This ticket could not be loaded."}</p>
        <Link to="/tickets" className="button-secondary mt-6">
          Back to tickets
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="panel p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="text-accent text-xs font-semibold uppercase tracking-[0.24em]"
            >
              Back to tickets
            </button>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">{ticket.title}</h1>
            <p className="text-soft mt-4 max-w-3xl text-base leading-8">{ticket.description}</p>
          </div>

          <div className="surface-soft rounded-3xl border px-5 py-4 text-sm font-medium text-blue-800">
            {timelineSummary}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Badge tone={statusTone(ticket.status)}>{formatEnum(ticket.status)}</Badge>
          <Badge tone={priorityTone(ticket.priority)}>{formatEnum(ticket.priority)}</Badge>
          <Badge tone="bg-blue-50 text-blue-700">{ticket.category.name}</Badge>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="panel p-8">
          <p className="text-sm font-semibold text-slate-900">Ticket details</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <MetaItem label="Created by" value={ticket.created_by.username} />
            <MetaItem label="Assigned to" value={ticket.assigned_to?.username ?? "Unassigned"} />
            <MetaItem label="Category" value={ticket.category.name} />
            <MetaItem label="Priority" value={formatEnum(ticket.priority)} />
            <MetaItem label="Created at" value={formatDate(ticket.created_at)} />
            <MetaItem label="Updated at" value={formatDate(ticket.updated_at)} />
          </dl>

          {attachmentCount ? (
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-900">Attachments</p>
              <div className="mt-4 grid gap-3">
                {ticket.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file}
                    target="_blank"
                    rel="noreferrer"
                    className="surface-soft rounded-2xl border px-4 py-4 text-sm font-medium text-blue-700 transition hover:border-blue-300"
                  >
                    Attachment #{attachment.id}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="panel p-8">
          <p className="text-sm font-semibold text-slate-900">Workflow controls</p>
          <p className="text-soft mt-2 text-sm leading-6">
            Agents can update status. Admins can update status and assignment.
          </p>

          {canUpdateTicket ? (
            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="ticket-status">
                  Status
                </label>
                <select
                  id="ticket-status"
                  className="field"
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as Ticket["status"])}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatEnum(status)}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="ticket-assignee">
                    Assign to agent
                  </label>
                  <select
                    id="ticket-assignee"
                    className="field"
                    value={assignedDraft}
                    onChange={(event) => setAssignedDraft(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.username}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <button type="button" className="button-primary w-full" onClick={handleTicketUpdate} disabled={isSavingTicket}>
                {isSavingTicket ? "Saving..." : "Save updates"}
              </button>
            </div>
          ) : (
            <div className="surface-muted mt-6 rounded-2xl border px-4 py-4 text-sm text-slate-600">
              Your role can review this ticket, but cannot change its workflow fields.
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Comments</p>
              <p className="text-soft mt-1 text-sm">Live discussion from the comments endpoint.</p>
            </div>
            <span className="badge-soft bg-blue-50 text-blue-700">
              {comments.length} total
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="surface-muted rounded-3xl border p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{comment.author.username}</p>
                      <p className="text-muted text-xs uppercase tracking-[0.24em]">
                        {comment.author.role}
                      </p>
                    </div>
                    <p className="text-soft text-sm">{formatDate(comment.created_at)}</p>
                  </div>
                  <p className="text-soft mt-4 text-sm leading-7">{comment.body}</p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center">
                <p className="font-semibold text-slate-900">No comments yet</p>
                <p className="text-soft mt-2 text-sm">Start the discussion with the form on the right.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel p-8">
          <p className="text-sm font-semibold text-slate-900">Add comment</p>
          <p className="text-soft mt-2 text-sm leading-6">
            Comments are posted to the existing `/api/comments/` endpoint.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleCommentSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="ticket-comment-body">
                Comment
              </label>
              <textarea
                id="ticket-comment-body"
                className="field min-h-40 resize-y"
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Share an update, ask a question, or document the next action."
              />
            </div>

            {commentError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {commentError}
              </div>
            ) : null}

            <button type="submit" className="button-primary w-full" disabled={isSubmittingComment || !commentBody.trim()}>
              {isSubmittingComment ? "Posting..." : "Post comment"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-soft rounded-2xl border px-4 py-4">
      <dt className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: string }) {
  return <span className={`badge-soft ${tone}`}>{children}</span>;
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
      return "bg-blue-100 text-blue-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    case "CLOSED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityTone(priority: Ticket["priority"]) {
  switch (priority) {
    case "HIGH":
      return "bg-rose-100 text-rose-700";
    case "MEDIUM":
      return "bg-blue-50 text-blue-700";
    case "LOW":
      return "bg-cyan-100 text-cyan-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
