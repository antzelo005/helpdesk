import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tickets", label: "Tickets" },
];

export function AppShell() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-mesh-soft px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-4 lg:flex-row">
        <aside className="panel flex w-full flex-col justify-between p-6 lg:w-80">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white">
                HD
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  HelpDesk
                </p>
                <h1 className="text-2xl font-extrabold text-ink">Control Center</h1>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-slate-950 px-5 py-6 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-teal-200">Signed in</p>
              <p className="mt-3 text-lg font-semibold">{currentUser?.username ?? "Loading..."}</p>
              <p className="text-sm text-slate-300">{currentUser?.email || "No email set"}</p>
              <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-100">
                {currentUser?.role ?? "Unknown"}
              </span>
            </div>

            <nav className="mt-8 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-teal-50 text-signal"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <button type="button" onClick={handleLogout} className="button-secondary mt-8 w-full">
            Logout
          </button>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
