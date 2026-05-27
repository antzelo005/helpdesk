import type { HTMLAttributes, PropsWithChildren } from "react";

type BadgeTone = "neutral" | "accent" | "danger";

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
  }
>;

const toneClassName: Record<BadgeTone, string> = {
  neutral: "badge-neutral",
  accent: "badge-accent",
  danger: "badge-danger",
};

export function Badge({
  children,
  className = "",
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={["badge-soft", toneClassName[tone], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
