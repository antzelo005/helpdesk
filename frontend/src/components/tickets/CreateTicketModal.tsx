import { AxiosError } from "axios";
import { FormEvent, useMemo, useState } from "react";

import { api } from "../../lib/api";
import type { TicketCategory } from "../../lib/types";

type CreateTicketModalProps = {
  categories: TicketCategory[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

type TicketPayload = {
  title: string;
  description: string;
  category_id: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

const defaultForm: TicketPayload = {
  title: "",
  description: "",
  category_id: "",
  priority: "MEDIUM",
};

export function CreateTicketModal({
  categories,
  isOpen,
  onClose,
  onCreated,
}: CreateTicketModalProps) {
  const [form, setForm] = useState<TicketPayload>(defaultForm);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(
    () => isSubmitting || !form.title.trim() || !form.description.trim() || !form.category_id,
    [form, isSubmitting],
  );

  if (!isOpen) {
    return null;
  }

  const resetAndClose = () => {
    setForm(defaultForm);
    setAttachment(null);
    setErrorMessage("");
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { data: ticket } = await api.post("tickets/", {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        priority: form.priority,
      });

      if (attachment) {
        const attachmentForm = new FormData();
        attachmentForm.append("ticket_id", String(ticket.id));
        attachmentForm.append("file", attachment);
        await api.post("attachments/", attachmentForm, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await onCreated();
      resetAndClose();
    } catch (error) {
      const message =
        error instanceof AxiosError && error.response?.data
          ? "Ticket creation failed. Check the form data and backend permissions."
          : "Ticket creation failed. Verify the backend is running.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-signal">
              New ticket
            </p>
            <h3 className="mt-3 text-2xl font-extrabold text-ink">Create support request</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Submit a new helpdesk ticket. If the backend accepts attachments, a file will be
              uploaded right after the ticket is created.
            </p>
          </div>

          <button type="button" className="button-secondary" onClick={resetAndClose}>
            Close
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="ticket-title">
              Title
            </label>
            <input
              id="ticket-title"
              className="field"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Describe the issue briefly"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-slate-700"
              htmlFor="ticket-description"
            >
              Description
            </label>
            <textarea
              id="ticket-description"
              className="field min-h-36 resize-y"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Explain the issue in enough detail for support to act on it."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="ticket-category"
              >
                Category
              </label>
              <select
                id="ticket-category"
                className="field"
                value={form.category_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category_id: event.target.value }))
                }
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="ticket-priority"
              >
                Priority
              </label>
              <select
                id="ticket-priority"
                className="field"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as TicketPayload["priority"],
                  }))
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-slate-700"
              htmlFor="ticket-attachment"
            >
              Attachment (optional)
            </label>
            <input
              id="ticket-attachment"
              type="file"
              className="field file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="button-secondary" onClick={resetAndClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={isDisabled}>
              {isSubmitting ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
