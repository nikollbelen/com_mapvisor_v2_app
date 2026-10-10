import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppUser } from "../types/auth";
import { mapvisorApi, setMapvisorAuthToken } from "../utils/mapvisorApi";

const SESSION_KEY = "mapvisor_auth_session";

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<{
    ok: boolean;
    error?: string;
  }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    mapvisorApi<{ ok: boolean; user: AppUser | null }>("/api/auth/me")
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        if (result.user) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const persistUser = useCallback((nextUser: AppUser | null) => {
    if (nextUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await mapvisorApi<{ ok: boolean; token: string; user: AppUser }>("/api/auth/login", {
        method: "POST",
        json: { email, password },
      });
      setMapvisorAuthToken(result.token);
      persistUser(result.user);
      return true;
    } catch {
      return false;
    }
  }, [persistUser]);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    try {
      const result = await mapvisorApi<{ ok: boolean; token: string; user: AppUser }>("/api/auth/register", {
        method: "POST",
        json: { full_name: fullName, email, password },
      });
      setMapvisorAuthToken(result.token);
      persistUser(result.user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo crear la cuenta.",
      };
    }
  }, [persistUser]);

  const logout = useCallback(async () => {
    try {
      await mapvisorApi("/api/auth/logout", { method: "POST" });
    } catch {
      /* limpiar sesión local aunque falle la red */
    }
    setMapvisorAuthToken(null);
    persistUser(null);
  }, [persistUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
