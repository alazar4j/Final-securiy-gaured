import { create } from "zustand";

type ThemeMode = "light" | "dark";
const STORAGE_KEY = "selam_theme";

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const initialMode = getInitialMode();
if (typeof window !== "undefined") applyMode(initialMode);

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
    set({ mode: next });
  },
  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyMode(mode);
    set({ mode });
  },
}));
