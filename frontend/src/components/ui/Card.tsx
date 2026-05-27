import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    muted?: boolean;
    soft?: boolean;
    as?: "article" | "section" | "div";
  }
>;

export function Card({
  children,
  className = "",
  muted = false,
  soft = false,
  as = "article",
  ...props
}: CardProps) {
  const Component = as;

  return (
    <Component
      className={[
        "rounded-3xl border",
        muted ? "surface-muted" : soft ? "surface-soft" : "panel",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
