import { AxiosError } from "axios";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { PageHeader } from "../components/ui/PageHeader";
import { TextInput } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../lib/api";

type RegisterForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
};

const defaultForm: RegisterForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  confirm_password: "",
};

export function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(defaultForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (form.password !== form.confirm_password) {
      const message = "Password confirmation does not match.";
      setFieldErrors({ confirm_password: message });
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.post("auth/register/", form);
      showToast("Account created successfully. Sign in with your new client account.", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data && typeof error.response.data === "object") {
        const responseData = error.response.data as Partial<Record<keyof RegisterForm, string[]>> & { detail?: string };
        const nextFieldErrors: Partial<Record<keyof RegisterForm, string>> = {};

        (Object.keys(form) as Array<keyof RegisterForm>).forEach((key) => {
          const value = responseData[key];
          if (Array.isArray(value) && value[0]) {
            nextFieldErrors[key] = value[0];
          }
        });

        setFieldErrors(nextFieldErrors);
        const message = responseData.detail || "Unable to register. Check the form values.";
        setFormError(message);
        showToast(message, "error");
      } else {
        const message = "Unable to register. Verify that the Django API is running.";
        setFormError(message);
        showToast(message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mesh-soft px-6 py-10">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/70 to-transparent" />
      <div className="absolute -left-12 top-20 h-52 w-52 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full bg-sky-200/15 blur-3xl" />
      <div className="relative w-full max-w-2xl">
        <section className="panel p-8 sm:p-10">
          <PageHeader
            eyebrow="Register"
            title="Create a client account"
            description="New registrations create client users only. Admin and agent roles remain backend-controlled."
            className="border-0 bg-transparent p-0 shadow-none"
          />

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <FormField id="register-username" label="Username" error={fieldErrors.username}>
              <TextInput
                id="register-username"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                autoComplete="username"
                disabled={isSubmitting}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="register-first-name" label="First name" error={fieldErrors.first_name}>
                <TextInput
                  id="register-first-name"
                  value={form.first_name}
                  onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField id="register-last-name" label="Last name" error={fieldErrors.last_name}>
                <TextInput
                  id="register-last-name"
                  value={form.last_name}
                  onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <FormField id="register-email" label="Email" error={fieldErrors.email}>
              <TextInput
                id="register-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="register-password" label="Password" error={fieldErrors.password}>
                <TextInput
                  id="register-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField
                id="register-confirm-password"
                label="Confirm password"
                error={fieldErrors.confirm_password}
              >
                <TextInput
                  id="register-confirm-password"
                  type="password"
                  value={form.confirm_password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, confirm_password: event.target.value }))
                  }
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            {formError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {formError}
              </div>
            ) : null}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="text-soft mt-6 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
