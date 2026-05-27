import type { PropsWithChildren } from "react";

type FormFieldProps = PropsWithChildren<{
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}>;

export function FormField({
  id,
  label,
  error,
  hint,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {!error && hint ? <p className="text-soft mt-2 text-sm">{hint}</p> : null}
    </div>
  );
}
