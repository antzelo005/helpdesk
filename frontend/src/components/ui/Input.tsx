import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["field", className].filter(Boolean).join(" ")} {...props} />;
}

export function SelectInput({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={["field", className].filter(Boolean).join(" ")} {...props} />;
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={["field", className].filter(Boolean).join(" ")} {...props} />;
}

export const Input = TextInput;
export const Select = SelectInput;
export const Textarea = TextArea;
