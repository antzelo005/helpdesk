import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  }
>;

const variantClassName: Record<ButtonVariant, string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  ghost: "button-ghost",
  danger: "button-danger",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        variantClassName[variant],
        sizeClassName[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
