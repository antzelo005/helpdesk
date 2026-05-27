import { Card } from "./Card";

export function InfoCard({
  label,
  value,
  soft = false,
  className = "",
}: {
  label: string;
  value?: string | number | null;
  soft?: boolean;
  className?: string;
}) {
  return (
    <Card muted={!soft} soft={soft} className={["p-5", className].filter(Boolean).join(" ")}>
      <dt className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">{label}</dt>
      <dd className="mt-3 text-lg font-semibold text-ink">{value ?? "Unavailable"}</dd>
    </Card>
  );
}
