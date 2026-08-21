import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { authApi, LoginInput, SignupInput } from "../api/auth";
import type { User } from "../types/domain";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: readonly string[]) => boolean;
  login: (input: LoginInput) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: current } = await authApi.me();
      setUser(current);
      return current;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (input: LoginInput) => {
      await authApi.login(input);
      const current = await refresh();
      if (!current) throw new Error("Login succeeded but the session could not be loaded.");
      return current;
    },
    [refresh]
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      await authApi.signup(input);
      const current = await refresh();
      if (!current) throw new Error("Signup succeeded but the session could not be loaded.");
      return current;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string) => user?.permissions.includes(permission) ?? false, [user]);
  const hasAnyPermission = useCallback(
    (permissions: readonly string[]) => permissions.some((p) => user?.permissions.includes(p)),
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
