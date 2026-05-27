import type { ReactNode } from "react";

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state rounded-3xl border border-dashed p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-blue-200 bg-[color:var(--color-surface-strong)] shadow-sm">
        <div className="relative h-7 w-7 rounded-xl border-2 border-blue-300">
          <div className="absolute inset-x-1 top-1 h-1 rounded bg-blue-200" />
          <div className="absolute inset-x-1 top-3 h-1 rounded bg-blue-100" />
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      <p className="text-soft mt-2 text-sm">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
