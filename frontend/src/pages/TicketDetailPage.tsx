import { AxiosError } from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { InfoCard } from "../components/ui/InfoCard";
import { PageHeader } from "../components/ui/PageHeader";
import { SelectInput, TextArea } from "../components/ui/Input";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { formatCommentTimestamp, formatDateTime, formatEnum, formatRelativeDate, formatRoleLabel } from "../lib/format";
import type { Ticket, TicketComment, UserSummary } from "../lib/types";

const STATUS_OPTIONS: Ticket["status"][] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
type DisplayComment = TicketComment & { optimistic?: boolean };

export function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [agents, setAgents] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      showToast(message, "error");
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
    const optimisticId = -Date.now();
    const optimisticComment: DisplayComment = {
      id: optimisticId,
      ticket: Number(ticketId),
      author: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            role: currentUser.role,
          }
        : {
            id: 0,
            username: "You",
            email: "",
            first_name: "",
            last_name: "",
            role: "CLIENT",
          },
      body: commentBody.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      optimistic: true,
    };

    setComments((current) => [...current, optimisticComment]);
    setCommentBody("");

    try {
      const { data } = await api.post<TicketComment>("comments/", {
        ticket_id: Number(ticketId),
        body: optimisticComment.body,
      });
      setComments((current) => current.map((comment) => (comment.id === optimisticId ? data : comment)));
      showToast("Comment posted.", "success");
    } catch {
      setComments((current) => current.filter((comment) => comment.id !== optimisticId));
      setCommentBody(optimisticComment.body);
      const message = "Unable to post the comment. Verify your access to this ticket.";
      setCommentError(message);
      showToast(message, "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTicketUpdate = async () => {
    if (!ticketId) {
      return;
    }

    if (!window.confirm("Save these ticket workflow changes?")) {
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
      showToast("Ticket workflow updated.", "success");
    } catch {
      const message = "Unable to save ticket updates. Check your role permissions.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketId) {
      return;
    }

    setIsDeletingTicket(true);
    try {
      await api.delete(`tickets/${ticketId}/`);
      showToast("Ticket deleted.", "success");
      navigate("/tickets", { replace: true });
    } catch {
      const message = "Unable to delete ticket. Check your role permissions.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setIsDeletingTicket(false);
      setIsDeleteDialogOpen(false);
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
        <section className="panel p-6 sm:p-8 lg:p-10">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="mt-4 h-10 w-2/3" />
          <LoadingSkeleton className="mt-6 h-24 rounded-3xl" />
        </section>
      </div>
    );
  }

  if (!ticket) {
    return (
      <section className="panel p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-ink">Ticket unavailable</p>
        <p className="text-soft mt-2 text-sm">{errorMessage || "This ticket could not be loaded."}</p>
        <Link to="/tickets" className="button-secondary mt-6 px-5 py-3">
          Back to tickets
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ticket detail"
        title={ticket.title}
        description={ticket.description}
        aside={
          <div className="flex flex-col gap-3">
            <Badge tone="accent">{timelineSummary}</Badge>
            {isAdmin ? (
              <Button variant="danger" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeletingTicket}>
                {isDeletingTicket ? "Deleting..." : "Delete ticket"}
              </Button>
            ) : null}
          </div>
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-6 px-0 py-0 text-accent"
          onClick={() => navigate("/tickets")}
        >
          Back to tickets
        </Button>
        <div className="mt-8 flex flex-wrap gap-3">
          <StatusBadge kind="status" value={ticket.status} />
          <StatusBadge kind="priority" value={ticket.priority} />
          <Badge tone="accent">{ticket.category.name}</Badge>
        </div>
      </PageHeader>

      {errorMessage ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <Button variant="secondary" onClick={() => void loadTicket()}>
            Retry
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-ink">Ticket details</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <MetaItem label="Created by" value={ticket.created_by.username} />
            <MetaItem label="Assigned to" value={ticket.assigned_to?.username ?? "Unassigned"} />
            <MetaItem label="Category" value={ticket.category.name} />
            <MetaItem label="Priority" value={formatEnum(ticket.priority)} />
            <MetaItem label="Created at" value={formatDateTime(ticket.created_at)} />
            <MetaItem label="Updated at" value={formatDateTime(ticket.updated_at)} />
          </dl>

          <div className="mt-8">
            <p className="text-sm font-semibold text-ink">Attachments</p>
            {attachmentCount ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {ticket.attachments.map((attachment) => {
                  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment.file);

                  return (
                    <Card soft key={attachment.id} className="overflow-hidden p-4">
                      {isImage ? (
                        <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]">
                          <img
                            src={attachment.file}
                            alt={`Attachment ${attachment.id}`}
                            className="h-44 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]">
                          <div className="text-center">
                            <div className="mx-auto h-12 w-12 rounded-2xl border-2 border-blue-300 bg-blue-50" />
                            <p className="mt-3 text-sm font-semibold text-ink">File preview unavailable</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">Attachment #{attachment.id}</p>
                          <p className="text-soft mt-1 text-xs">
                            Added {formatRelativeDate(attachment.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={attachment.file}
                            target="_blank"
                            rel="noreferrer"
                            className="button-secondary px-4 py-2.5"
                          >
                            Preview
                          </a>
                          <a href={attachment.file} download className="button-primary px-4 py-2.5">
                            Download
                          </a>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No attachments yet" message="Files uploaded to this ticket will appear here." />
            )}
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-ink">Workflow controls</p>
          <p className="text-soft mt-2 text-sm leading-6">
            Agents can update status. Admins can update status and assignment.
          </p>

          {canUpdateTicket ? (
            <div className="mt-6 space-y-5">
              <FormField id="ticket-status" label="Status">
                <SelectInput
                  id="ticket-status"
                  disabled={isSavingTicket}
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as Ticket["status"])}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatEnum(status)}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              {isAdmin ? (
                <FormField id="ticket-assignee" label="Assign to agent">
                  <SelectInput
                    id="ticket-assignee"
                    disabled={isSavingTicket}
                    value={assignedDraft}
                    onChange={(event) => setAssignedDraft(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.username}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              ) : null}

              <Button type="button" fullWidth onClick={handleTicketUpdate} disabled={isSavingTicket}>
                {isSavingTicket ? "Saving..." : "Save updates"}
              </Button>
              {isSavingTicket ? (
                <div className="space-y-3">
                  <LoadingSkeleton className="h-3 w-28" />
                  <LoadingSkeleton className="h-10 rounded-2xl" />
                </div>
              ) : null}
            </div>
          ) : (
            <Card muted className="mt-6 px-4 py-4 text-sm text-soft">
              Your role can review this ticket, but cannot change its workflow fields.
            </Card>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">Comments</p>
              <p className="text-soft mt-1 text-sm">Ticket discussion and updates.</p>
            </div>
            <Badge tone="accent">{comments.length} total</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {comments.length ? (
              comments.map((comment) => (
                <Card key={comment.id} muted className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{comment.author.username}</p>
                        {comment.optimistic ? (
                          <span className="badge-soft bg-blue-100 text-blue-700">Sending...</span>
                        ) : null}
                      </div>
                      <p className="text-muted text-xs uppercase tracking-[0.24em]">
                        {formatRoleLabel(comment.author.role)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-soft text-sm">{formatCommentTimestamp(comment.created_at)}</p>
                      <p className="text-muted text-xs">{formatRelativeDate(comment.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-soft mt-4 text-sm leading-7">{comment.body}</p>
                </Card>
              ))
            ) : (
              <EmptyState title="No comments yet" message="Start the discussion with the form on the right." />
            )}
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-ink">Add comment</p>
          <p className="text-soft mt-2 text-sm leading-6">
            Add a status update, request clarification, or document the next action for this ticket.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleCommentSubmit}>
            <FormField id="ticket-comment-body" label="Comment">
              <TextArea
                id="ticket-comment-body"
                className="min-h-40 resize-y"
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Share an update, ask a question, or document the next action."
                disabled={isSubmittingComment}
              />
            </FormField>

            {commentError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {commentError}
              </div>
            ) : null}

            <Button type="submit" fullWidth disabled={isSubmittingComment || !commentBody.trim()}>
              {isSubmittingComment ? "Posting..." : "Post comment"}
            </Button>
          </form>
        </Card>
      </section>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete this ticket?"
        message="This action permanently removes the ticket and its related workflow history from the visible queue."
        confirmLabel="Delete ticket"
        tone="danger"
        isLoading={isDeletingTicket}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => void handleDeleteTicket()}
      />
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return <InfoCard label={label} value={value} soft className="px-4 py-4" />;
}
