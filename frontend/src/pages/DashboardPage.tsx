import { useEffect, useState } from "react";

import { useAuth, type CurrentUser } from "../context/AuthContext";

export function DashboardPage() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      return;
    }

    let active = true;

    const loadUser = async () => {
      setIsRefreshing(true);
      setErrorMessage("");
      try {
        await refreshCurrentUser();
      } catch {
        if (active) {
          setErrorMessage("Unable to load current user details from /auth/me/.");
        }
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, [currentUser, refreshCurrentUser]);

  const profile = currentUser as CurrentUser | null;

  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.4fr_0.9fr] lg:p-10">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-[0.24em]">
              Dashboard
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
              Current session overview
            </h2>
            <p className="text-soft mt-4 max-w-2xl text-base leading-8">
              This page confirms JWT-authenticated access by loading the current user from
              the backend. It is the frontend checkpoint before ticket workflows are added.
            </p>
          </div>

          <div className="surface-soft rounded-[2rem] border p-6">
            <p className="text-accent text-xs uppercase tracking-[0.24em]">API status</p>
            <p className="mt-4 text-3xl font-bold text-ink">
              {profile ? "Connected" : isRefreshing ? "Loading..." : "Pending"}
            </p>
            <p className="text-soft mt-3 text-sm leading-6">
              Source: <span className="font-semibold text-blue-700">GET /api/auth/me/</span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Current user</p>
              <p className="mt-1 text-sm text-slate-500">Loaded from the Django auth endpoint</p>
            </div>
            <button
              type="button"
              className="button-secondary"
              onClick={async () => {
                setIsRefreshing(true);
                setErrorMessage("");
                try {
                  await refreshCurrentUser();
                } catch {
                  setErrorMessage("Refresh failed. Check the backend session.");
                } finally {
                  setIsRefreshing(false);
                }
              }}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard label="Username" value={profile?.username} />
            <InfoCard label="Role" value={profile?.role} />
            <InfoCard label="Email" value={profile?.email || "No email set"} />
            <InfoCard
              label="Name"
              value={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Not provided"}
            />
          </dl>
        </article>

        <article className="panel p-8">
          <p className="text-sm font-semibold text-slate-900">Frontend phase status</p>
          <ul className="text-soft mt-5 space-y-4 text-sm">
            <li className="surface-soft rounded-2xl border px-4 py-4">
              JWT login is wired with access and refresh token storage.
            </li>
            <li className="surface-muted rounded-2xl border px-4 py-4">
              Protected routes gate the dashboard and tickets pages.
            </li>
            <li className="surface-muted rounded-2xl border px-4 py-4">
              Ticket browsing and creation are intentionally deferred to the next phase.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="surface-muted rounded-3xl border p-5">
      <dt className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">{label}</dt>
      <dd className="mt-3 text-lg font-semibold text-slate-900">{value ?? "Unavailable"}</dd>
    </div>
  );
}
