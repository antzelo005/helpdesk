import { AxiosError } from "axios";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { TextInput, SelectInput, TextArea } from "../ui/Input";
import { useToast } from "../../context/ToastContext";
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
  const { showToast } = useToast();
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

  const resetAndClose = (skipConfirm = false) => {
    const isDirty = form.title || form.description || form.category_id || attachment;
    if (!skipConfirm && isDirty && !isSubmitting && !window.confirm("Discard this ticket draft?")) {
      return;
    }
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
      showToast("Ticket created successfully.", "success");
      resetAndClose(true);
    } catch (error) {
      const message =
        error instanceof AxiosError && error.response?.data
          ? "Ticket creation failed. Check the form data and backend permissions."
          : "Ticket creation failed. Verify the backend is running.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-[0.24em]">
              New ticket
            </p>
            <h3 className="mt-3 text-2xl font-extrabold text-ink">Create support request</h3>
            <p className="text-soft mt-3 text-sm leading-6">
              Submit a new helpdesk ticket. If the backend accepts attachments, a file will be
              uploaded right after the ticket is created.
            </p>
          </div>

          <Button type="button" variant="secondary" onClick={() => resetAndClose()}>
            Close
          </Button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <FormField id="ticket-title" label="Title">
            <TextInput
              id="ticket-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Describe the issue briefly"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField id="ticket-description" label="Description">
            <TextArea
              id="ticket-description"
              className="min-h-36 resize-y"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Explain the issue in enough detail for support to act on it."
              disabled={isSubmitting}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="ticket-category" label="Category">
              <SelectInput
                id="ticket-category"
                value={form.category_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category_id: event.target.value }))
                }
                disabled={isSubmitting}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField id="ticket-priority" label="Priority">
              <SelectInput
                id="ticket-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as TicketPayload["priority"],
                  }))
                }
                disabled={isSubmitting}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </SelectInput>
            </FormField>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-ink"
              htmlFor="ticket-attachment"
            >
              Attachment (optional)
            </label>
            <input
              id="ticket-attachment"
              type="file"
              className="field file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => resetAndClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {isSubmitting ? "Creating..." : "Create ticket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
