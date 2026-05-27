import { Button } from "./Button";
import { Card } from "./Card";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  tone = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        <p className="text-lg font-semibold text-ink">{title}</p>
        <p className="text-soft mt-3 text-sm leading-6">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
