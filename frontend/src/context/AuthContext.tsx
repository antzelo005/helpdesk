import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { authApi, api } from "../lib/api";
import { clearTokens, hasAccessToken, setTokens, type AuthTokens } from "../lib/auth";

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "CLIENT" | "AGENT" | "ADMIN";
};

type LoginPayload = {
  username: string;
  password: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  currentUser: CurrentUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasAccessToken());
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const refreshCurrentUser = async () => {
    const { data } = await api.get<CurrentUser>("auth/me/");
    setCurrentUser(data);
    setIsAuthenticated(true);
  };

  const login = async (payload: LoginPayload) => {
    const { data } = await authApi.post<AuthTokens>("auth/token/", payload);
    setTokens(data);
    setIsAuthenticated(true);
    await refreshCurrentUser();
  };

  const logout = () => {
    clearTokens();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!hasAccessToken()) {
        if (isMounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        await refreshCurrentUser();
      } catch {
        clearTokens();
        if (isMounted) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isBootstrapping,
      currentUser,
      login,
      logout,
      refreshCurrentUser,
    }),
    [currentUser, isAuthenticated, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
