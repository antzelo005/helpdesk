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
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-teal-100/60 to-transparent" />
      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="panel hidden p-10 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-signal">HelpDesk Portal</p>
          <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-tight text-ink">
            Move from scattered ticket updates to a clean operating console.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            This first frontend phase gives your team a focused entry point with JWT login,
            protected routes, and a clear view of who is signed in.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Secure API access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tokens are stored locally and sent automatically with future requests.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Role-aware views</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The backend keeps role restrictions in place while the UI stays simple.
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-8 sm:p-10">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink">Sign in to HelpDesk</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Demo login</p>
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
