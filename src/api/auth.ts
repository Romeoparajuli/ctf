import { api } from "./client";
import type { User } from "../types/domain";

export interface SignupInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  signup: (input: SignupInput) => api.post<{ ok: true }>("/auth/signup", input),
  login: (input: LoginInput) => api.post<{ ok: true }>("/auth/login", input),
  logout: () => api.post<{ ok: true }>("/auth/logout"),
  me: () => api.get<{ user: User }>("/auth/me"),
};
