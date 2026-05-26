import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function TicketsPage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-4">
      <section className="panel p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-signal">Tickets</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
              Ticket workspace is staged for the next build.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Authentication and routing are already in place. The next phase can plug ticket
              listing, detail views, assignment changes, and create flows directly into this shell.
            </p>
          </div>

          <div className="rounded-3xl bg-teal-50 px-5 py-4 text-sm font-medium text-teal-900">
            Signed in as {currentUser?.username ?? "Unknown"} ({currentUser?.role ?? "Unknown"})
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Role-based API"
          body="The backend still enforces CLIENT, AGENT, and ADMIN access exactly as before."
        />
        <Card
          title="JWT ready"
          body="Every Axios request automatically includes the current bearer token."
        />
        <Card
          title="Next integration"
          body="Ticket list and ticket detail pages can be added without changing the auth layer."
        />
      </section>

      <section className="panel p-8">
        <p className="text-sm font-semibold text-slate-900">What comes next</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-base font-semibold text-slate-900">Planned ticket features</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>List tickets from `GET /api/tickets/`.</li>
              <li>Filter by status, priority, and assignment.</li>
              <li>Open a ticket detail page with comments and attachments.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-base font-semibold text-slate-900">Current scope</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Ticket creation is intentionally not implemented yet. Use the dashboard to verify
              login state and the backend Swagger UI for API inspection.
            </p>
            <Link to="/dashboard" className="button-secondary mt-6">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <article className="panel p-6">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
    </article>
  );
}
