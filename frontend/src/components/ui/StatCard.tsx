import type { ReactNode } from "react";

import { Card } from "./Card";

export function StatCard({
  label,
  value,
  description,
  meta,
}: {
  label: string;
  value: ReactNode;
  description: string;
  meta?: string;
}) {
  return (
    <Card className="flex min-h-[196px] flex-col justify-between p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-muted text-xs font-semibold uppercase tracking-[0.22em]">{label}</p>
        {meta ? <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{meta}</span> : null}
      </div>
      <p className="mt-4 text-4xl font-extrabold text-ink">{value}</p>
      <p className="text-soft mt-3 text-sm leading-6">{description}</p>
    </Card>
  );
}
