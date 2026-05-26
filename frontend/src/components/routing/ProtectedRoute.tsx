import { Navigate, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh-soft px-6">
        <div className="panel w-full max-w-md p-8 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-teal-100" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
