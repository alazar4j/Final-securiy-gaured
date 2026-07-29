import { create } from "zustand";
import { api } from "../lib/api";
import type { AppUser, Language } from "../types";

const TOKEN_KEY = "selam_token";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: AppUser) => void;
  setLanguage: (lang: Language) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const session = await api.login(username, password);
      localStorage.setItem(TOKEN_KEY, session.token);
      set({ user: session.user, initialized: true });
      return session.user;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, initialized: true });
      return;
    }
    try {
      const { user } = await api.me();
      set({ user, initialized: true });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, initialized: true });
    }
  },

  setUser: (user) => set({ user }),

  setLanguage: (lang) => {
    const current = get().user;
    if (current) set({ user: { ...current, language: lang } });
    api.updateLanguage(lang).catch(() => {});
  },
}));
