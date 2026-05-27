import type { PropsWithChildren, ReactNode } from "react";

type PageHeaderProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
}>;

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  className = "",
  children,
}: PageHeaderProps) {
  return (
    <section className={["panel p-8 lg:p-10", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-accent text-xs font-semibold uppercase tracking-[0.24em]">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">{title}</h1>
          {description ? <p className="text-soft mt-4 max-w-3xl text-base leading-8">{description}</p> : null}
          {children}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </section>
  );
}
