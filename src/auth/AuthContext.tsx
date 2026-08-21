import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { authApi, LoginInput, SignupInput } from "../api/auth";
import type { User } from "../types/domain";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: current } = await authApi.me();
      setUser(current);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    await authApi.login(input);
    await refresh();
  }, [refresh]);

  const signup = useCallback(async (input: SignupInput) => {
    await authApi.signup(input);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string) => user?.permissions.includes(permission) ?? false, [user]);
  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((p) => user?.permissions.includes(p)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, hasPermission, hasAnyPermission, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider.");
  return ctx;
}
