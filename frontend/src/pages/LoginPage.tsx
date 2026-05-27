import { AxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { PageHeader } from "../components/ui/PageHeader";
import { TextInput } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const THEME_STORAGE_KEY = "helpdesk-theme";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [username, setUsername] = useState("admin_demo");
  const [password, setPassword] = useState("DemoPass123!");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<"helpdesk-light" | "helpdesk-dark">(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "helpdesk-dark" ? "helpdesk-dark" : "helpdesk-light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      showToast("Signed in successfully.", "success");
      navigate(state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      const message =
        error instanceof AxiosError && error.response?.status === 401
          ? "Invalid credentials. Check the username and password."
          : "Unable to sign in. Verify that the Django API is running.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mesh-soft px-6 py-10">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/70 to-transparent" />
      <div className="absolute -left-12 top-20 h-52 w-52 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full bg-sky-200/15 blur-3xl" />
      <div className="relative grid w-full max-w-[1380px] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="panel hidden p-10 lg:block">
          <p className="text-accent text-xs font-semibold uppercase tracking-[0.26em]">HelpDesk Portal</p>
          <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-tight text-ink">
            Move from scattered ticket updates to a clean operating console.
          </h1>
          <p className="text-soft mt-6 max-w-lg text-lg leading-8">
            This first frontend phase gives your team a focused entry point with JWT login,
            protected routes, and a clear view of who is signed in.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="surface-soft rounded-3xl border p-5">
              <p className="text-sm font-semibold text-ink">Secure API access</p>
              <p className="text-soft mt-2 text-sm leading-6">
                Tokens are stored locally and sent automatically with future requests.
              </p>
            </div>
            <div className="surface-muted rounded-3xl border p-5">
              <p className="text-sm font-semibold text-ink">Role-aware views</p>
              <p className="text-soft mt-2 text-sm leading-6">
                The backend keeps role restrictions in place while the UI stays simple.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <button
              type="button"
              className="theme-toggle login-theme-toggle"
              role="switch"
              aria-checked={theme === "helpdesk-dark"}
              aria-label="Toggle theme"
              onClick={() =>
                setTheme((current) =>
                  current === "helpdesk-light" ? "helpdesk-dark" : "helpdesk-light",
                )
              }
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb" />
              </span>
              <span className="text-base font-semibold text-ink">
                {theme === "helpdesk-light" ? "Light mode" : "Dark mode"}
              </span>
            </button>
          </div>
        </section>

        <section className="panel p-8 sm:p-10">
          <PageHeader
            eyebrow="Welcome back"
            title="Sign in to HelpDesk"
            description="Use one of the seeded demo users or your own backend account."
            className="border-0 bg-transparent p-0 shadow-none"
          />

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <FormField id="username" label="Username">
              <TextInput
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin_demo"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="password" label="Password">
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="DemoPass123!"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </FormField>

            {errorMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="surface-muted mt-8 rounded-3xl border p-5">
            <p className="text-muted text-xs font-semibold uppercase tracking-[0.22em]">Demo login</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <DemoCredential role="Admin" username="admin_demo" />
              <DemoCredential role="Agent" username="agent_demo" />
              <DemoCredential role="Client" username="client_demo" />
            </div>
          </div>

          <p className="text-soft mt-6 text-sm">
            Need a new client account?{" "}
            <Link to="/register" className="font-semibold text-accent hover:underline">
              Register here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

function DemoCredential({ role, username }: { role: string; username: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
      <p className="text-muted text-xs font-semibold uppercase tracking-[0.18em]">{role}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{username}</p>
      <p className="text-soft mt-1 text-sm">DemoPass123!</p>
    </div>
  );
}
