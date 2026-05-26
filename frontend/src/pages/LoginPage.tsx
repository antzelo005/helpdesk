import { AxiosError } from "axios";
import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [username, setUsername] = useState("admin_demo");
  const [password, setPassword] = useState("DemoPass123!");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigate(state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      const message =
        error instanceof AxiosError && error.response?.status === 401
          ? "Invalid credentials. Check the username and password."
          : "Unable to sign in. Verify that the Django API is running.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mesh-soft px-6 py-10">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/70 to-transparent" />
      <div className="absolute -left-12 top-20 h-52 w-52 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
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
              <p className="text-sm font-semibold text-slate-900">Secure API access</p>
              <p className="text-soft mt-2 text-sm leading-6">
                Tokens are stored locally and sent automatically with future requests.
              </p>
            </div>
            <div className="surface-muted rounded-3xl border p-5">
              <p className="text-sm font-semibold text-slate-900">Role-aware views</p>
              <p className="text-soft mt-2 text-sm leading-6">
                The backend keeps role restrictions in place while the UI stays simple.
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-8 sm:p-10">
          <div className="max-w-md">
            <p className="text-muted text-xs font-semibold uppercase tracking-[0.26em]">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink">Sign in to HelpDesk</h2>
            <p className="text-soft mt-3 text-sm leading-6">
              Use one of the seeded demo users or your own backend account.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin_demo"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="DemoPass123!"
                autoComplete="current-password"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            ) : null}

            <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 rounded-3xl bg-slate-50 p-5">
            <p className="text-muted text-xs font-semibold uppercase tracking-[0.22em]">Demo login</p>
            <p className="mt-3 text-sm text-slate-700">
              Username: <span className="font-semibold">admin_demo</span>
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Password: <span className="font-semibold">DemoPass123!</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
